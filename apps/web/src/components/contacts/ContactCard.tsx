import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import type { Contact } from "~/api/contacts";

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <Link to="/contacts/$contactId" params={{ contactId: contact.id }}>
      <Card hover className="h-full">
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-700 dark:text-primary-300 font-medium">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {contact.name}
              </h3>
              {contact.email && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {contact.email}
                </p>
              )}
            </div>
          </div>

          {contact.relationship && (
            <div className="mt-3">
              <Badge variant="default" size="sm">
                {contact.relationship}
              </Badge>
            </div>
          )}

          {contact.phone && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {contact.phone}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
