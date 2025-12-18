import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "~/components/layout/PageHeader";
import { Card, CardContent } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { Badge } from "~/components/ui/Badge";
import { Modal } from "~/components/ui/Modal";
import { Loading } from "~/components/ui/Spinner";
import { ContactForm, type ContactFormData } from "~/components/contacts/ContactForm";
import { useContact, useUpdateContact, useDeleteContact } from "~/hooks/useContacts";
import { formatDate } from "~/utils/dates";

export const Route = createFileRoute("/contacts/$contactId")({
  component: ContactDetailPage,
});

function ContactDetailPage() {
  const { contactId } = Route.useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: contact, isLoading } = useContact(contactId);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  if (isLoading) {
    return <Loading message="Loading contact..." />;
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Contact not found
        </h2>
        <Button className="mt-4" onClick={() => navigate({ to: "/contacts" })}>
          Back to Contacts
        </Button>
      </div>
    );
  }

  const handleUpdate = (data: ContactFormData) => {
    updateContact.mutate(
      { id: contactId, ...data },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const handleDelete = () => {
    deleteContact.mutate(contactId, {
      onSuccess: () => navigate({ to: "/contacts" }),
    });
  };

  return (
    <div>
      <PageHeader
        title={contact.name}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              Delete
            </Button>
          </div>
        }
      />

      {isEditing ? (
        <Card className="max-w-2xl">
          <CardContent className="pt-6">
            <ContactForm
              contact={contact}
              onSubmit={handleUpdate}
              onCancel={() => setIsEditing(false)}
              isLoading={updateContact.isPending}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-medium text-primary-700 dark:text-primary-300">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {contact.name}
                  </h2>
                  {contact.relationship && (
                    <Badge variant="default">{contact.relationship}</Badge>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {contact.email && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Email
                    </h3>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}

                {contact.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Phone
                    </h3>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}

                {contact.notes && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Notes
                    </h3>
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                      {contact.notes}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Added {formatDate(contact.createdAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Contact"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete this contact? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteContact.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
