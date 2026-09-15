import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{
    uid: string;
  }>;
};

export default async function LegacyCompanyAliasPage({ params }: Props) {
  const { uid } = await params;
  redirect(`/company/${uid}`);
}
