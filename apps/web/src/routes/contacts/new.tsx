import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent } from "~/components/ui/Card";
import { ContactForm, type ContactFormData } from "~/components/contacts/ContactForm";
import { useCreateContact } from "~/hooks/useContacts";

export const Route = createFileRoute("/contacts/new")({
  component: NewContactPage,
});

function NewContactPage() {
  const navigate = useNavigate();
  const createContact = useCreateContact();

  const handleSubmit = (data: ContactFormData) => {
    createContact.mutate(data, {
      onSuccess: () => navigate({ to: "/contacts" }),
    });
  };

  return (
    <div>
      <PageHeader
        title="Add Contact"
        description="Add a new contact to your network"
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <ContactForm
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: "/contacts" })}
            isLoading={createContact.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
