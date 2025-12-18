/**
 * XML utilities for CardDAV protocol
 * Handles WebDAV XML request parsing and response generation
 * Adapted from simon-mcp for life-system
 */

const DAV_NS = "DAV:";
const CARDDAV_NS = "urn:ietf:params:xml:ns:carddav";

// Maximum vCard size (1MB)
const MAX_RESOURCE_SIZE = 1048576;

/**
 * Contact data for XML responses
 */
export interface XMLContact {
  id: string;
  etag: string;
  vcardData: string;
  updatedAt: string;
  createdAt: string;
}

/**
 * Contact group data for XML responses
 */
export interface XMLContactGroup {
  id: string;
  etag: string;
  vcardData: string;
  updatedAt: string;
  createdAt: string;
}

/**
 * Address book (category) data for XML responses
 */
export interface XMLAddressBook {
  id: string;
  name: string;
  description?: string;
  color?: string;
  syncToken?: string;
}

/**
 * Filter types for addressbook-query
 */
export interface AddressBookFilter {
  property: string;
  textMatch?: string;
  matchType?: "contains" | "equals" | "starts-with" | "ends-with";
  negate?: boolean;
}

/**
 * XML Parser for CardDAV requests
 */
export class XMLParser {
  /**
   * Parse PROPFIND request to extract requested properties
   */
  static parsePropsRequest(xml: string): string[] {
    const props: string[] = [];

    if (xml.includes("allprop") || xml.includes("all-prop")) {
      return ["allprop"];
    }

    const propMatch = xml.match(/<(?:D:)?prop[^>]*>([\s\S]*?)<\/(?:D:)?prop>/i);
    if (propMatch) {
      const propContent = propMatch[1];

      if (propContent.includes("resourcetype")) props.push("resourcetype");
      if (propContent.includes("displayname")) props.push("displayname");
      if (propContent.includes("getetag")) props.push("getetag");
      if (propContent.includes("getcontenttype")) props.push("getcontenttype");
      if (propContent.includes("getlastmodified")) props.push("getlastmodified");
      if (propContent.includes("current-user-principal"))
        props.push("current-user-principal");
      if (propContent.includes("principal-URL")) props.push("principal-URL");
      if (propContent.includes("addressbook-home-set"))
        props.push("addressbook-home-set");
      if (propContent.includes("address-data")) props.push("address-data");
      if (propContent.includes("supported-address-data"))
        props.push("supported-address-data");
      if (propContent.includes("supported-report-set"))
        props.push("supported-report-set");
      if (propContent.includes("getctag")) props.push("getctag");
      if (propContent.includes("sync-token")) props.push("sync-token");
      if (propContent.includes("max-resource-size")) props.push("max-resource-size");
      if (propContent.includes("me-card")) props.push("me-card");
      if (propContent.includes("owner")) props.push("owner");
    }

    return props.length > 0 ? props : ["allprop"];
  }

  /**
   * Parse REPORT request body
   */
  static parseReport(xml: string): {
    type: string;
    hrefs?: string[];
    syncToken?: string;
    props: string[];
    filters?: AddressBookFilter[];
  } {
    const props = this.parsePropsRequest(xml);

    if (
      xml.includes("addressbook-multiget") ||
      xml.includes("address-book-multiget")
    ) {
      const hrefs: string[] = [];
      const hrefMatches = xml.matchAll(
        /<(?:[a-zA-Z][a-zA-Z0-9]*:)?href[^>]*>([^<]+)<\/(?:[a-zA-Z][a-zA-Z0-9]*:)?href>/gi
      );
      for (const match of hrefMatches) {
        hrefs.push(match[1].trim());
      }
      return { type: "addressbook-multiget", hrefs, props };
    }

    if (xml.includes("sync-collection")) {
      const syncTokenMatch = xml.match(
        /<(?:D:)?sync-token>([^<]*)<\/(?:D:)?sync-token>/i
      );
      let syncToken = syncTokenMatch ? syncTokenMatch[1].trim() : undefined;
      if (syncToken && syncToken.startsWith("data:,")) {
        syncToken = syncToken.substring(6);
      }
      return { type: "sync-collection", syncToken, props };
    }

    if (xml.includes("addressbook-query")) {
      const filters = this.parseAddressBookFilters(xml);
      return { type: "addressbook-query", props, filters };
    }

    return { type: "unknown", props };
  }

  private static parseAddressBookFilters(xml: string): AddressBookFilter[] {
    const filters: AddressBookFilter[] = [];

    const propFilterRegex =
      /<(?:C:)?prop-filter[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/(?:C:)?prop-filter>/gi;
    let propMatch;

    while ((propMatch = propFilterRegex.exec(xml)) !== null) {
      const property = propMatch[1].toUpperCase();
      const filterContent = propMatch[2];

      const textMatchRegex =
        /<(?:C:)?text-match[^>]*(?:match-type="([^"]*)")?[^>]*>([^<]*)<\/(?:C:)?text-match>/i;
      const textMatch = filterContent.match(textMatchRegex);

      if (textMatch) {
        const matchType = (textMatch[1] || "contains") as AddressBookFilter["matchType"];
        const searchText = textMatch[2].trim();
        const negate = filterContent.includes('negate-condition="yes"');

        filters.push({
          property,
          textMatch: searchText,
          matchType,
          negate,
        });
      } else {
        filters.push({
          property,
        });
      }
    }

    return filters;
  }
}

/**
 * XML Builder for CardDAV responses
 */
export class XMLBuilder {
  /**
   * Generate principal discovery response
   */
  static principalResponse(
    displayName: string,
    addressBooks: XMLAddressBook[]
  ): string {
    const homeSetEntries = addressBooks
      .map((ab) => `          <D:href>/carddav/addressbooks/${ab.id}/</D:href>`)
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="${DAV_NS}" xmlns:C="${CARDDAV_NS}" xmlns:CS="http://calendarserver.org/ns/">
  <D:response>
    <D:href>/carddav/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:collection/>
          <D:principal/>
        </D:resourcetype>
        <D:displayname>${this.escapeXml(displayName)}'s Contacts</D:displayname>
        <C:addressbook-home-set>
${homeSetEntries}
        </C:addressbook-home-set>
        <D:current-user-principal>
          <D:href>/carddav/</D:href>
        </D:current-user-principal>
        <D:principal-URL>
          <D:href>/carddav/</D:href>
        </D:principal-URL>
        <D:principal-collection-set>
          <D:href>/carddav/</D:href>
        </D:principal-collection-set>
        <D:supported-report-set>
          <D:supported-report>
            <D:report><C:addressbook-multiget/></D:report>
          </D:supported-report>
          <D:supported-report>
            <D:report><C:addressbook-query/></D:report>
          </D:supported-report>
          <D:supported-report>
            <D:report><D:sync-collection/></D:report>
          </D:supported-report>
          <D:supported-report>
            <D:report><D:expand-property/></D:report>
          </D:supported-report>
        </D:supported-report-set>
        <CS:email-address-set/>
        <C:directory-gateway/>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>
</D:multistatus>`;
  }

  /**
   * Generate address book home-set response listing all address books
   */
  static addressBookHomeSetResponse(addressBooks: XMLAddressBook[]): string {
    const addressBookResponses = addressBooks
      .map(
        (ab) => `
  <D:response>
    <D:href>/carddav/addressbooks/${ab.id}/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:collection/>
          <C:addressbook/>
        </D:resourcetype>
        <D:displayname>${this.escapeXml(ab.name)}</D:displayname>
        ${ab.description ? `<C:addressbook-description>${this.escapeXml(ab.description)}</C:addressbook-description>` : ""}
        ${ab.color ? `<A:calendar-color xmlns:A="http://apple.com/ns/ical/">${this.escapeXml(ab.color)}</A:calendar-color>` : ""}
        <D:current-user-privilege-set>
          <D:privilege><D:read/></D:privilege>
          <D:privilege><D:write/></D:privilege>
          <D:privilege><D:write-content/></D:privilege>
          <D:privilege><D:write-properties/></D:privilege>
          <D:privilege><D:bind/></D:privilege>
          <D:privilege><D:unbind/></D:privilege>
        </D:current-user-privilege-set>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="${DAV_NS}" xmlns:C="${CARDDAV_NS}" xmlns:CS="http://calendarserver.org/ns/">
  <D:response>
    <D:href>/carddav/addressbooks/</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:collection/>
        </D:resourcetype>
        <D:displayname>Address Books</D:displayname>
        <D:current-user-privilege-set>
          <D:privilege><D:read/></D:privilege>
          <D:privilege><D:write/></D:privilege>
          <D:privilege><D:write-content/></D:privilege>
          <D:privilege><D:write-properties/></D:privilege>
          <D:privilege><D:bind/></D:privilege>
          <D:privilege><D:unbind/></D:privilege>
        </D:current-user-privilege-set>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>${addressBookResponses}
</D:multistatus>`;
  }

  /**
   * Generate address book response with contacts listing
   */
  static addressBookListResponse(
    addressBook: XMLAddressBook,
    contacts: XMLContact[],
    groups: XMLContactGroup[],
    basePath: string
  ): string {
    const syncToken = addressBook.syncToken ||
      Buffer.from(new Date().toISOString()).toString("base64");
    const ctag = `"${Date.now()}"`;

    const contactResponses = contacts
      .map(
        (contact) => `
  <D:response>
    <D:href>${basePath}${contact.id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getetag>${this.escapeXml(contact.etag)}</D:getetag>
        <D:getcontenttype>text/vcard; charset=utf-8</D:getcontenttype>
        <D:getlastmodified>${this.formatLastModified(contact.updatedAt || contact.createdAt)}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
      )
      .join("");

    const groupResponses = groups
      .map(
        (group) => `
  <D:response>
    <D:href>${basePath}${group.id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype/>
        <D:getetag>${this.escapeXml(group.etag)}</D:getetag>
        <D:getcontenttype>text/vcard; charset=utf-8</D:getcontenttype>
        <D:getlastmodified>${this.formatLastModified(group.updatedAt || group.createdAt)}</D:getlastmodified>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="${DAV_NS}" xmlns:C="${CARDDAV_NS}" xmlns:CS="http://calendarserver.org/ns/">
  <D:response>
    <D:href>${basePath}</D:href>
    <D:propstat>
      <D:prop>
        <D:resourcetype>
          <D:collection/>
          <C:addressbook/>
        </D:resourcetype>
        <D:displayname>${this.escapeXml(addressBook.name)}</D:displayname>
        ${addressBook.description ? `<C:addressbook-description>${this.escapeXml(addressBook.description)}</C:addressbook-description>` : ""}
        ${addressBook.color ? `<A:calendar-color xmlns:A="http://apple.com/ns/ical/">${this.escapeXml(addressBook.color)}</A:calendar-color>` : ""}
        <CS:getctag>${ctag}</CS:getctag>
        <D:sync-token>data:,${syncToken}</D:sync-token>
        <C:supported-address-data>
          <C:address-data-type content-type="text/vcard" version="3.0"/>
          <C:address-data-type content-type="text/vcard" version="4.0"/>
        </C:supported-address-data>
        <C:max-resource-size>${MAX_RESOURCE_SIZE}</C:max-resource-size>
        <D:supported-report-set>
          <D:supported-report>
            <D:report><C:addressbook-multiget/></D:report>
          </D:supported-report>
          <D:supported-report>
            <D:report><C:addressbook-query/></D:report>
          </D:supported-report>
          <D:supported-report>
            <D:report><D:sync-collection/></D:report>
          </D:supported-report>
        </D:supported-report-set>
        <D:current-user-privilege-set>
          <D:privilege><D:read/></D:privilege>
          <D:privilege><D:write/></D:privilege>
          <D:privilege><D:write-content/></D:privilege>
          <D:privilege><D:bind/></D:privilege>
          <D:privilege><D:unbind/></D:privilege>
        </D:current-user-privilege-set>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>${contactResponses}${groupResponses}
</D:multistatus>`;
  }

  /**
   * Generate multiget response with vCard data
   */
  static multigetResponse(
    contacts: XMLContact[],
    groups: XMLContactGroup[],
    hrefs: string[],
    basePath: string
  ): string {
    const foundResponses = contacts
      .map(
        (contact) => `
  <D:response>
    <D:href>${basePath}${contact.id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>${this.escapeXml(contact.etag)}</D:getetag>
        <D:getlastmodified>${this.formatLastModified(contact.updatedAt || contact.createdAt)}</D:getlastmodified>
        <C:address-data>${this.escapeXml(contact.vcardData)}</C:address-data>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
      )
      .join("");

    const groupResponses = groups
      .map(
        (group) => `
  <D:response>
    <D:href>${basePath}${group.id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>${this.escapeXml(group.etag)}</D:getetag>
        <D:getlastmodified>${this.formatLastModified(group.updatedAt || group.createdAt)}</D:getlastmodified>
        <C:address-data>${this.escapeXml(group.vcardData)}</C:address-data>
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
      )
      .join("");

    // Generate 404 responses for resources that weren't found
    const foundIds = new Set([
      ...contacts.map((c) => c.id),
      ...groups.map((g) => g.id),
    ]);
    const notFoundResponses = hrefs
      .filter((href) => {
        const match = href.match(/\/([^/]+)\.vcf$/);
        return match && !foundIds.has(match[1]);
      })
      .map(
        (href) => `
  <D:response>
    <D:href>${this.escapeXml(href)}</D:href>
    <D:status>HTTP/1.1 404 Not Found</D:status>
  </D:response>`
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="${DAV_NS}" xmlns:C="${CARDDAV_NS}">${foundResponses}${groupResponses}${notFoundResponses}
</D:multistatus>`;
  }

  /**
   * Generate sync-collection response
   */
  static syncResponse(
    contacts: XMLContact[],
    groups: XMLContactGroup[],
    deletedContactIds: string[],
    deletedGroupIds: string[],
    syncToken: string,
    includeData: boolean,
    basePath: string
  ): string {
    const modifiedContactResponses = contacts
      .map(
        (contact) => `
  <D:response>
    <D:href>${basePath}${contact.id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>${this.escapeXml(contact.etag)}</D:getetag>
        <D:getlastmodified>${this.formatLastModified(contact.updatedAt || contact.createdAt)}</D:getlastmodified>
        ${includeData ? `<C:address-data>${this.escapeXml(contact.vcardData)}</C:address-data>` : ""}
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
      )
      .join("");

    const modifiedGroupResponses = groups
      .map(
        (group) => `
  <D:response>
    <D:href>${basePath}${group.id}.vcf</D:href>
    <D:propstat>
      <D:prop>
        <D:getetag>${this.escapeXml(group.etag)}</D:getetag>
        <D:getlastmodified>${this.formatLastModified(group.updatedAt || group.createdAt)}</D:getlastmodified>
        ${includeData ? `<C:address-data>${this.escapeXml(group.vcardData)}</C:address-data>` : ""}
      </D:prop>
      <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
  </D:response>`
      )
      .join("");

    const deletedContactResponses = deletedContactIds
      .map(
        (id) => `
  <D:response>
    <D:href>${basePath}${id}.vcf</D:href>
    <D:status>HTTP/1.1 404 Not Found</D:status>
  </D:response>`
      )
      .join("");

    const deletedGroupResponses = deletedGroupIds
      .map(
        (id) => `
  <D:response>
    <D:href>${basePath}${id}.vcf</D:href>
    <D:status>HTTP/1.1 404 Not Found</D:status>
  </D:response>`
      )
      .join("");

    return `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="${DAV_NS}" xmlns:C="${CARDDAV_NS}">${modifiedContactResponses}${modifiedGroupResponses}${deletedContactResponses}${deletedGroupResponses}
  <D:sync-token>data:,${syncToken}</D:sync-token>
</D:multistatus>`;
  }

  /**
   * Generate not found response
   */
  static notFoundResponse(href: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<D:multistatus xmlns:D="${DAV_NS}">
  <D:response>
    <D:href>${this.escapeXml(href)}</D:href>
    <D:status>HTTP/1.1 404 Not Found</D:status>
  </D:response>
</D:multistatus>`;
  }

  /**
   * Format date for WebDAV getlastmodified (RFC 1123)
   */
  private static formatLastModified(dateStr: string): string {
    return new Date(dateStr).toUTCString();
  }

  /**
   * Escape special XML characters
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
