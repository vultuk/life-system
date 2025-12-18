import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Loading } from "~/components/ui/Spinner";
import { ContactList } from "~/components/contacts/ContactList";
import { useContacts } from "~/hooks/useContacts";

export const Route = createFileRoute("/contacts/")({
  component: ContactsPage,
});

function ContactsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useContacts({
    search: search || undefined,
    page,
    limit: 12,
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Manage your contacts and relationships"
        action={
          <Button onClick={() => navigate({ to: "/contacts/new" })}>
            Add Contact
          </Button>
        }
      />

      <div className="mb-6">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-md"
        />
      </div>

      {isLoading ? (
        <Loading message="Loading contacts..." />
      ) : (
        <ContactList
          contacts={data?.items || []}
          total={data?.total || 0}
          page={page}
          limit={12}
          onPageChange={setPage}
          onCreateClick={() => navigate({ to: "/contacts/new" })}
        />
      )}
    </div>
  );
}
