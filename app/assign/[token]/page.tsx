import TicketAssignClient from './AssignClient';

export function generateStaticParams() {
  return [{ token: 'assign' }];
}

export default function AssignPage() {
  return <TicketAssignClient />;
}
