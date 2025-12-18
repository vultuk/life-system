import { Hono } from "hono";
import { getUser, type AuthUser } from "../middleware/basicAuth";
import {
  XMLParser,
  XMLBuilder,
  VCardGenerator,
  type XMLAddressBook,
} from "@life/shared";
import {
  getAddressBooks,
  getAddressBookById,
  toXMLAddressBook,
  ensureDefaultAddressBook,
} from "../services/addressBooks";
import {
  getContactsByCategory,
  getContactById,
  getContactsByIds,
  getContactsModifiedSince,
  createContactFromVCard,
  updateContactFromVCard,
  deleteContact,
  getDeletedContactIdsSince,
  toXMLContact,
} from "../services/contacts";
import {
  getGroupsByCategory,
  getGroupById,
  getGroupsByIds,
  getGroupsModifiedSince,
  createGroupFromVCard,
  updateGroupFromVCard,
  deleteGroup,
  getDeletedGroupIdsSince,
  toXMLContactGroup,
} from "../services/groups";

const carddavRoutes = new Hono();

// DAV headers for OPTIONS responses
const DAV_HEADERS = {
  DAV: "1, 2, 3, addressbook, access-control",
  Allow: "OPTIONS, GET, HEAD, PUT, DELETE, PROPFIND, REPORT",
  "Content-Type": "application/xml; charset=utf-8",
};

/**
 * OPTIONS handler - advertise DAV capabilities
 */
carddavRoutes.on("OPTIONS", "/*", (c) => {
  return c.text("", 200, DAV_HEADERS);
});

/**
 * PROPFIND on root - principal discovery
 */
carddavRoutes.on("PROPFIND", "/", async (c) => {
  const user = getUser(c);
  const body = await c.req.text();
  const props = XMLParser.parsePropsRequest(body);

  // Get user's address books (categories)
  let addressBooks = await getAddressBooks(user.userId);

  // Ensure at least one address book exists
  if (addressBooks.length === 0) {
    const defaultBook = await ensureDefaultAddressBook(user.userId);
    addressBooks = [defaultBook];
  }

  const xmlAddressBooks: XMLAddressBook[] = addressBooks.map(toXMLAddressBook);
  const xml = XMLBuilder.principalResponse(user.email.split("@")[0], xmlAddressBooks);

  return c.text(xml, 207, { "Content-Type": "application/xml; charset=utf-8" });
});

/**
 * PROPFIND on /addressbooks/ - list all address books
 */
carddavRoutes.on("PROPFIND", "/addressbooks/", async (c) => {
  const user = getUser(c);

  let addressBooks = await getAddressBooks(user.userId);
  if (addressBooks.length === 0) {
    const defaultBook = await ensureDefaultAddressBook(user.userId);
    addressBooks = [defaultBook];
  }

  const xmlAddressBooks: XMLAddressBook[] = addressBooks.map(toXMLAddressBook);
  const xml = XMLBuilder.addressBookHomeSetResponse(xmlAddressBooks);

  return c.text(xml, 207, { "Content-Type": "application/xml; charset=utf-8" });
});

/**
 * PROPFIND on /addressbooks/:categoryId/ - list contacts in an address book
 */
carddavRoutes.on("PROPFIND", "/addressbooks/:categoryId/", async (c) => {
  const user = getUser(c);
  const categoryId = c.req.param("categoryId");

  const addressBook = await getAddressBookById(user.userId, categoryId);
  if (!addressBook) {
    return c.text("Not Found", 404);
  }

  const contacts = await getContactsByCategory(user.userId, categoryId);
  const groups = await getGroupsByCategory(user.userId, categoryId);

  const basePath = `/carddav/addressbooks/${categoryId}/`;
  const xml = XMLBuilder.addressBookListResponse(
    toXMLAddressBook(addressBook),
    contacts.map(toXMLContact),
    groups.map(toXMLContactGroup),
    basePath
  );

  return c.text(xml, 207, { "Content-Type": "application/xml; charset=utf-8" });
});

/**
 * REPORT handler - multiget, sync-collection, query
 */
carddavRoutes.on("REPORT", "/addressbooks/:categoryId/", async (c) => {
  const user = getUser(c);
  const categoryId = c.req.param("categoryId");
  const body = await c.req.text();

  const addressBook = await getAddressBookById(user.userId, categoryId);
  if (!addressBook) {
    return c.text("Not Found", 404);
  }

  const report = XMLParser.parseReport(body);
  const basePath = `/carddav/addressbooks/${categoryId}/`;

  if (report.type === "addressbook-multiget") {
    // Extract contact/group IDs from hrefs
    const ids: string[] = [];
    for (const href of report.hrefs || []) {
      const match = href.match(/\/([^/]+)\.vcf$/);
      if (match) {
        ids.push(match[1]);
      }
    }

    const contacts = await getContactsByIds(user.userId, ids);
    const groups = await getGroupsByIds(user.userId, ids);

    const xml = XMLBuilder.multigetResponse(
      contacts.map(toXMLContact),
      groups.map(toXMLContactGroup),
      report.hrefs || [],
      basePath
    );

    return c.text(xml, 207, { "Content-Type": "application/xml; charset=utf-8" });
  }

  if (report.type === "sync-collection") {
    let sinceDate: Date | null = null;

    if (report.syncToken) {
      try {
        const decoded = Buffer.from(report.syncToken, "base64").toString("utf-8");
        sinceDate = new Date(decoded);
      } catch {
        // Invalid token, do full sync
        sinceDate = null;
      }
    }

    let contacts;
    let groups;
    let deletedContactIds: string[] = [];
    let deletedGroupIds: string[] = [];

    if (sinceDate) {
      // Incremental sync
      contacts = await getContactsModifiedSince(user.userId, categoryId, sinceDate);
      groups = await getGroupsModifiedSince(user.userId, categoryId, sinceDate);
      deletedContactIds = await getDeletedContactIdsSince(user.userId, categoryId, sinceDate);
      deletedGroupIds = await getDeletedGroupIdsSince(user.userId, categoryId, sinceDate);
    } else {
      // Full sync
      contacts = await getContactsByCategory(user.userId, categoryId);
      groups = await getGroupsByCategory(user.userId, categoryId);
    }

    const newSyncToken = Buffer.from(new Date().toISOString()).toString("base64");
    const includeData = report.props.includes("address-data") || report.props.includes("allprop");

    const xml = XMLBuilder.syncResponse(
      contacts.map(toXMLContact),
      groups.map(toXMLContactGroup),
      deletedContactIds,
      deletedGroupIds,
      newSyncToken,
      includeData,
      basePath
    );

    return c.text(xml, 207, { "Content-Type": "application/xml; charset=utf-8" });
  }

  if (report.type === "addressbook-query") {
    // For now, return all contacts - filtering can be added later
    const contacts = await getContactsByCategory(user.userId, categoryId);
    const groups = await getGroupsByCategory(user.userId, categoryId);

    const xml = XMLBuilder.multigetResponse(
      contacts.map(toXMLContact),
      groups.map(toXMLContactGroup),
      [],
      basePath
    );

    return c.text(xml, 207, { "Content-Type": "application/xml; charset=utf-8" });
  }

  return c.text("Unknown report type", 400);
});

/**
 * GET single contact/group vCard
 */
carddavRoutes.get("/addressbooks/:categoryId/:resourceId.vcf", async (c) => {
  const user = getUser(c);
  const categoryId = c.req.param("categoryId");
  const resourceId = c.req.param("resourceId");

  // Try to find as contact first
  const contact = await getContactById(user.userId, resourceId);
  if (contact) {
    return c.text(contact.vcardData, 200, {
      "Content-Type": "text/vcard; charset=utf-8",
      ETag: contact.etag,
    });
  }

  // Try as group
  const group = await getGroupById(user.userId, resourceId);
  if (group) {
    return c.text(group.vcardData, 200, {
      "Content-Type": "text/vcard; charset=utf-8",
      ETag: group.etag,
    });
  }

  return c.text("Not Found", 404);
});

/**
 * HEAD single contact/group - get metadata
 */
carddavRoutes.on("HEAD", "/addressbooks/:categoryId/:resourceId.vcf", async (c) => {
  const user = getUser(c);
  const resourceId = c.req.param("resourceId");

  const contact = await getContactById(user.userId, resourceId);
  if (contact) {
    return c.body(null, 200, {
      "Content-Type": "text/vcard; charset=utf-8",
      ETag: contact.etag,
    });
  }

  const group = await getGroupById(user.userId, resourceId);
  if (group) {
    return c.body(null, 200, {
      "Content-Type": "text/vcard; charset=utf-8",
      ETag: group.etag,
    });
  }

  return c.body(null, 404);
});

/**
 * PUT create/update contact or group
 */
carddavRoutes.put("/addressbooks/:categoryId/:resourceId.vcf", async (c) => {
  const user = getUser(c);
  const categoryId = c.req.param("categoryId");
  const resourceId = c.req.param("resourceId");
  const vcardData = await c.req.text();

  const addressBook = await getAddressBookById(user.userId, categoryId);
  if (!addressBook) {
    return c.text("Address book not found", 404);
  }

  const ifMatch = c.req.header("If-Match");
  const ifNoneMatch = c.req.header("If-None-Match");

  // Check if it's a group vCard
  const isGroup = VCardGenerator.isGroupVCard(vcardData);

  if (isGroup) {
    const existingGroup = await getGroupById(user.userId, resourceId);

    if (ifNoneMatch === "*" && existingGroup) {
      return c.text("Precondition Failed", 412);
    }

    if (ifMatch && existingGroup) {
      const normalizedIfMatch = ifMatch.replace(/"/g, "");
      const normalizedEtag = existingGroup.etag.replace(/"/g, "");
      if (normalizedIfMatch !== normalizedEtag) {
        return c.text("Precondition Failed", 412);
      }
    }

    if (existingGroup) {
      const group = await updateGroupFromVCard(user.userId, resourceId, vcardData);
      if (group) {
        return c.body(null, 204, { ETag: group.etag });
      }
    } else {
      const group = await createGroupFromVCard(user.userId, categoryId, vcardData, resourceId);
      return c.body(null, 201, { ETag: group.etag });
    }
  } else {
    const existingContact = await getContactById(user.userId, resourceId);

    if (ifNoneMatch === "*" && existingContact) {
      return c.text("Precondition Failed", 412);
    }

    if (ifMatch && existingContact) {
      const normalizedIfMatch = ifMatch.replace(/"/g, "");
      const normalizedEtag = existingContact.etag.replace(/"/g, "");
      if (normalizedIfMatch !== normalizedEtag) {
        return c.text("Precondition Failed", 412);
      }
    }

    if (existingContact) {
      const contact = await updateContactFromVCard(user.userId, resourceId, vcardData);
      if (contact) {
        return c.body(null, 204, { ETag: contact.etag });
      }
    } else {
      const contact = await createContactFromVCard(user.userId, categoryId, vcardData, resourceId);
      return c.body(null, 201, { ETag: contact.etag });
    }
  }

  return c.text("Internal Server Error", 500);
});

/**
 * DELETE contact or group
 */
carddavRoutes.delete("/addressbooks/:categoryId/:resourceId.vcf", async (c) => {
  const user = getUser(c);
  const resourceId = c.req.param("resourceId");

  // Try to delete as contact
  const deletedContact = await deleteContact(user.userId, resourceId);
  if (deletedContact) {
    return c.body(null, 204);
  }

  // Try to delete as group
  const deletedGroup = await deleteGroup(user.userId, resourceId);
  if (deletedGroup) {
    return c.body(null, 204);
  }

  return c.text("Not Found", 404);
});

export { carddavRoutes };
