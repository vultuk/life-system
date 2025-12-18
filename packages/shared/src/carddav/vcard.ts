/**
 * vCard utility for parsing and generating vCard 3.0 and 4.0 formats
 * Follows RFC 2426 (vCard 3.0) and RFC 6350 (vCard 4.0) specifications
 * Adapted from simon-mcp for life-system
 */

export type VCardVersion = "3.0" | "4.0";

export type ContactEmailType = "work" | "home" | "other";
export type ContactPhoneType = "mobile" | "work" | "home" | "fax" | "other";
export type ContactAddressType = "work" | "home" | "other";

export interface ContactEmail {
  type: ContactEmailType;
  value: string;
}

export interface ContactPhone {
  type: ContactPhoneType;
  value: string;
}

export interface ContactAddress {
  type: ContactAddressType;
  street?: string;
  city?: string;
  region?: string;
  postal_code?: string;
  country?: string;
}

export interface ContactUrl {
  type: "work" | "home" | "other";
  value: string;
}

/**
 * Input for creating/updating a contact via vCard
 */
export interface VCardContactInput {
  id?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
  nickname?: string;
  organization?: string;
  jobTitle?: string;
  emails?: ContactEmail[];
  phoneNumbers?: ContactPhone[];
  addresses?: ContactAddress[];
  urls?: ContactUrl[];
  birthday?: string;
  notes?: string;
  photoData?: string;
  photoMediaType?: string;
  category?: string;
}

/**
 * Parsed group vCard data
 */
export interface ParsedGroupVCard {
  kind: "group";
  displayName: string;
  description?: string;
  memberIds: string[];
  uid?: string;
}

/**
 * vCard generator and parser
 */
export class VCardGenerator {
  /**
   * Check if a vCard string represents a group (KIND:group or X-ADDRESSBOOKSERVER-KIND:group)
   */
  static isGroupVCard(vcardString: string): boolean {
    const lines = this.unfoldLines(vcardString);
    for (const line of lines) {
      const upper = line.toUpperCase();
      if (upper.startsWith("KIND:")) {
        return upper.includes("GROUP");
      }
      if (upper.startsWith("X-ADDRESSBOOKSERVER-KIND:")) {
        return upper.includes("GROUP");
      }
    }
    return false;
  }

  /**
   * Parse a group vCard string
   */
  static parseGroupVCard(vcardString: string): ParsedGroupVCard | null {
    if (!this.isGroupVCard(vcardString)) {
      return null;
    }

    const lines = this.unfoldLines(vcardString);
    const result: ParsedGroupVCard = {
      kind: "group",
      displayName: "",
      memberIds: [],
    };

    for (const line of lines) {
      if (!line || line.startsWith("BEGIN:") || line.startsWith("END:")) {
        continue;
      }

      const { property, value } = this.parseLine(line);
      const propertyUpper = property.toUpperCase();

      switch (propertyUpper) {
        case "FN":
          result.displayName = this.unescape(value);
          break;
        case "NOTE":
          result.description = this.unescape(value);
          break;
        case "UID": {
          const uidMatch = value.match(/urn:uuid:(.+)/i);
          result.uid = uidMatch ? uidMatch[1] : value;
          break;
        }
        case "MEMBER": {
          const memberMatch = value.match(/urn:uuid:(.+)/i);
          if (memberMatch) {
            result.memberIds.push(memberMatch[1]);
          }
          break;
        }
        case "X-ADDRESSBOOKSERVER-MEMBER": {
          const appleMemberMatch = value.match(/urn:uuid:(.+)/i);
          if (appleMemberMatch) {
            result.memberIds.push(appleMemberMatch[1]);
          }
          break;
        }
      }
    }

    return result.displayName ? result : null;
  }

  /**
   * Generate a group vCard string (Apple vCard 3.0 format for iOS/macOS)
   */
  static generateGroup(
    id: string,
    displayName: string,
    memberIds: string[],
    description?: string
  ): string {
    const lines: string[] = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "PRODID:-//Life System//CardDAV Server//EN",
      "X-ADDRESSBOOKSERVER-KIND:group",
      `FN:${this.escape(displayName)}`,
      `UID:urn:uuid:${id}`,
      `N:${this.escape(displayName)};;;;`,
    ];

    if (description) {
      lines.push(`NOTE:${this.escape(description)}`);
    }

    for (const memberId of memberIds) {
      lines.push(`X-ADDRESSBOOKSERVER-MEMBER:urn:uuid:${memberId}`);
    }

    const rev = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    lines.push(`REV:${rev}`);
    lines.push("END:VCARD");

    return lines.map((line) => this.foldLine(line)).join("\r\n");
  }

  /**
   * Generate a vCard string from contact data
   */
  static generate(contact: VCardContactInput, version: VCardVersion = "3.0"): string {
    const lines: string[] = [];

    lines.push("BEGIN:VCARD");
    lines.push(`VERSION:${version}`);
    lines.push("PRODID:-//Life System//CardDAV Server//EN");

    // Full name (required)
    const fn =
      contact.displayName ||
      [contact.givenName, contact.familyName].filter(Boolean).join(" ") ||
      "Unknown";
    lines.push(`FN:${this.escape(fn)}`);

    // Structured name
    const n = [
      this.escapeComponent(contact.familyName || ""),
      this.escapeComponent(contact.givenName || ""),
      "",
      "",
      "",
    ].join(";");
    lines.push(`N:${n}`);

    if (contact.nickname) {
      lines.push(`NICKNAME:${this.escape(contact.nickname)}`);
    }

    if (contact.organization) {
      lines.push(`ORG:${this.escape(contact.organization)}`);
    }

    if (contact.jobTitle) {
      lines.push(`TITLE:${this.escape(contact.jobTitle)}`);
    }

    if (contact.emails && contact.emails.length > 0) {
      for (const email of contact.emails) {
        const type = (email.type || "other").toUpperCase();
        lines.push(`EMAIL;TYPE=INTERNET,${type}:${email.value}`);
      }
    }

    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      for (const phone of contact.phoneNumbers) {
        const type = this.mapPhoneTypeToVCard(phone.type);
        lines.push(`TEL;TYPE=${type}:${phone.value}`);
      }
    }

    if (contact.addresses && contact.addresses.length > 0) {
      for (const addr of contact.addresses) {
        const type = (addr.type || "other").toUpperCase();
        const adr = [
          "",
          "",
          this.escapeComponent(addr.street || ""),
          this.escapeComponent(addr.city || ""),
          this.escapeComponent(addr.region || ""),
          this.escapeComponent(addr.postal_code || ""),
          this.escapeComponent(addr.country || ""),
        ].join(";");
        lines.push(`ADR;TYPE=${type}:${adr}`);
      }
    }

    if (contact.urls && contact.urls.length > 0) {
      for (const url of contact.urls) {
        const type = (url.type || "other").toUpperCase();
        lines.push(`URL;TYPE=${type}:${url.value}`);
      }
    }

    if (contact.birthday) {
      const bday = contact.birthday.replace(/-/g, "");
      lines.push(`BDAY:${bday}`);
    }

    if (contact.notes) {
      lines.push(`NOTE:${this.escape(contact.notes)}`);
    }

    if (contact.photoData && contact.photoMediaType) {
      if (version === "4.0") {
        lines.push(
          `PHOTO:data:${contact.photoMediaType};base64,${contact.photoData}`
        );
      } else {
        const encoding = "b";
        const type = contact.photoMediaType.split("/")[1]?.toUpperCase() || "JPEG";
        lines.push(`PHOTO;ENCODING=${encoding};TYPE=${type}:${contact.photoData}`);
      }
    }

    if (contact.category) {
      lines.push(`CATEGORIES:${contact.category}`);
    }

    if (contact.id) {
      lines.push(`UID:${contact.id}`);
    }

    const rev = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    lines.push(`REV:${rev}`);

    lines.push("END:VCARD");

    return lines.map((line) => this.foldLine(line)).join("\r\n");
  }

  /**
   * Fold a line to comply with RFC 2426 (max 75 octets per line)
   */
  private static foldLine(line: string, maxLength: number = 75): string {
    if (line.length <= maxLength) {
      return line;
    }

    const result: string[] = [];
    let remaining = line;

    result.push(remaining.substring(0, maxLength));
    remaining = remaining.substring(maxLength);

    while (remaining.length > 0) {
      result.push(" " + remaining.substring(0, maxLength - 1));
      remaining = remaining.substring(maxLength - 1);
    }

    return result.join("\r\n");
  }

  /**
   * Parse a vCard string into contact fields
   */
  static parse(vcardString: string): VCardContactInput {
    const lines = this.unfoldLines(vcardString);
    const contact: VCardContactInput & {
      emails: ContactEmail[];
      phoneNumbers: ContactPhone[];
      addresses: ContactAddress[];
      urls: ContactUrl[];
    } = {
      emails: [],
      phoneNumbers: [],
      addresses: [],
      urls: [],
    };

    for (const line of lines) {
      if (!line || line.startsWith("BEGIN:") || line.startsWith("END:")) {
        continue;
      }

      const { property, params, value } = this.parseLine(line);

      switch (property.toUpperCase()) {
        case "FN":
          contact.displayName = this.unescape(value);
          break;
        case "N": {
          const [family, given] = value.split(";");
          contact.familyName = family || undefined;
          contact.givenName = given || undefined;
          break;
        }
        case "NICKNAME":
          contact.nickname = this.unescape(value);
          break;
        case "ORG":
          contact.organization = this.unescape(value.split(";")[0]);
          break;
        case "TITLE":
          contact.jobTitle = this.unescape(value);
          break;
        case "EMAIL":
          contact.emails.push({
            type: this.extractEmailType(params),
            value: value,
          });
          break;
        case "TEL":
          contact.phoneNumbers.push({
            type: this.extractPhoneType(params),
            value: value,
          });
          break;
        case "ADR": {
          const [, , street, city, region, postal, country] = value.split(";");
          contact.addresses.push({
            type: this.extractAddressType(params),
            street: street || undefined,
            city: city || undefined,
            region: region || undefined,
            postal_code: postal || undefined,
            country: country || undefined,
          });
          break;
        }
        case "URL":
          contact.urls.push({
            type: this.extractAddressType(params) as "work" | "home" | "other",
            value: value,
          });
          break;
        case "BDAY":
          contact.birthday = this.parseBirthday(value);
          break;
        case "NOTE":
          contact.notes = this.unescape(value);
          break;
        case "PHOTO": {
          const photoData = this.parsePhoto(params, value);
          if (photoData) {
            contact.photoData = photoData.data;
            contact.photoMediaType = photoData.mediaType;
          }
          break;
        }
        case "CATEGORIES": {
          contact.category = value.split(",")[0];
          break;
        }
        case "UID": {
          // Handle urn:uuid:xxx format
          const uidMatch = value.match(/urn:uuid:(.+)/i);
          contact.id = uidMatch ? uidMatch[1] : value;
          break;
        }
      }
    }

    // Clean up empty arrays
    if (contact.emails.length === 0) delete (contact as VCardContactInput).emails;
    if (contact.phoneNumbers.length === 0)
      delete (contact as VCardContactInput).phoneNumbers;
    if (contact.addresses.length === 0)
      delete (contact as VCardContactInput).addresses;
    if (contact.urls.length === 0) delete (contact as VCardContactInput).urls;

    return contact;
  }

  /**
   * Generate ETag from vCard data
   */
  static generateEtag(vcardData: string): string {
    // Use a simple hash of the vCard data
    let hash = 0;
    for (let i = 0; i < vcardData.length; i++) {
      const char = vcardData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(16)}"`;
  }

  private static escape(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;")
      .replace(/\n/g, "\\n");
  }

  private static escapeComponent(text: string): string {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  private static unescape(text: string): string {
    return text
      .replace(/\\n/g, "\n")
      .replace(/\\;/g, ";")
      .replace(/\\,/g, ",")
      .replace(/\\\\/g, "\\");
  }

  private static unfoldLines(vcard: string): string[] {
    const normalized = vcard.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
    return normalized.split("\n").filter((line) => line.trim());
  }

  private static parseLine(line: string): {
    property: string;
    params: string[];
    value: string;
  } {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) {
      return { property: line, params: [], value: "" };
    }

    const beforeColon = line.substring(0, colonIndex);
    const value = line.substring(colonIndex + 1);

    const semicolonIndex = beforeColon.indexOf(";");
    if (semicolonIndex === -1) {
      return { property: beforeColon, params: [], value };
    }

    const property = beforeColon.substring(0, semicolonIndex);
    const paramsString = beforeColon.substring(semicolonIndex + 1);
    const params = paramsString.split(";");

    return { property, params, value };
  }

  private static extractEmailType(params: string[]): ContactEmailType {
    for (const param of params) {
      const upper = param.toUpperCase();
      if (upper.includes("WORK")) return "work";
      if (upper.includes("HOME")) return "home";
    }
    return "other";
  }

  private static extractPhoneType(params: string[]): ContactPhoneType {
    for (const param of params) {
      const upper = param.toUpperCase();
      if (upper.includes("CELL") || upper.includes("MOBILE")) return "mobile";
      if (upper.includes("WORK")) return "work";
      if (upper.includes("HOME")) return "home";
      if (upper.includes("FAX")) return "fax";
    }
    return "other";
  }

  private static extractAddressType(params: string[]): ContactAddressType {
    for (const param of params) {
      const upper = param.toUpperCase();
      if (upper.includes("WORK")) return "work";
      if (upper.includes("HOME")) return "home";
    }
    return "other";
  }

  private static mapPhoneTypeToVCard(type: ContactPhoneType): string {
    switch (type) {
      case "mobile":
        return "CELL";
      case "work":
        return "WORK,VOICE";
      case "home":
        return "HOME,VOICE";
      case "fax":
        return "FAX";
      default:
        return "VOICE";
    }
  }

  private static parseBirthday(value: string): string {
    if (value.length === 8 && !value.includes("-")) {
      return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
    if (value.startsWith("--") && value.length === 6) {
      return `0000-${value.slice(2, 4)}-${value.slice(4, 6)}`;
    }
    return value;
  }

  private static parsePhoto(
    params: string[],
    value: string
  ): { data: string; mediaType: string } | null {
    if (value.startsWith("data:")) {
      const match = value.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        return {
          mediaType: match[1],
          data: match[2],
        };
      }
    }

    let mediaType = "image/jpeg";
    let isBase64 = false;

    for (const param of params) {
      const upper = param.toUpperCase();
      if (upper.includes("ENCODING=B") || upper.includes("ENCODING=BASE64")) {
        isBase64 = true;
      }
      if (upper.includes("TYPE=")) {
        const typeMatch = upper.match(/TYPE=(\w+)/);
        if (typeMatch) {
          const type = typeMatch[1].toLowerCase();
          mediaType = `image/${type}`;
        }
      }
      if (upper.includes("MEDIATYPE=")) {
        const mtMatch = param.match(/MEDIATYPE=([^;]+)/i);
        if (mtMatch) {
          mediaType = mtMatch[1];
        }
      }
    }

    if (isBase64 && value) {
      return {
        data: value,
        mediaType,
      };
    }

    if (value && !value.startsWith("http") && !value.startsWith("data:")) {
      return {
        data: value,
        mediaType,
      };
    }

    return null;
  }
}
