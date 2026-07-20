// Delegate entirely to a client component so events are fetched fresh on every visit
import HomeClient from './HomeClient';

export default function Home() {
  return <HomeClient />;
}
