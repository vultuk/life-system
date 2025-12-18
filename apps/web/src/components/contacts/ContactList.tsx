import { ContactCard } from "./ContactCard";
import { EmptyState } from "~/components/ui/EmptyState";
import { Pagination } from "~/components/ui/Pagination";
import type { Contact } from "~/api/contacts";

interface ContactListProps {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onCreateClick: () => void;
}

export function ContactList({
  contacts,
  total,
  page,
  limit,
  onPageChange,
  onCreateClick,
}: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={<ContactIcon />}
        title="No contacts found"
        description="Get started by adding your first contact"
        action={{ label: "Add Contact", onClick: onCreateClick }}
      />
    );
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <ContactCard key={contact.id} contact={contact} />
        ))}
      </div>
      <Pagination
        page={page}
        limit={limit}
        total={total}
        onPageChange={onPageChange}
      />
    </div>
  );
}

function ContactIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
