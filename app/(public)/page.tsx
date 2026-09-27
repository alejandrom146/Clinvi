import ForProfessionals from '@/components/home/ForProfessionals';
import Hero from '@/components/home/Hero';
import SpecialtiesGrid from '@/components/home/SpecialtiesGrid';
import { getHomeStats } from '@/lib/queries/profesionales';

export default async function HomePage() {
  const stats = await getHomeStats();
  return (
    <>
      <Hero stats={stats} />
      <SpecialtiesGrid />
      <ForProfessionals />
    </>
  );
}
