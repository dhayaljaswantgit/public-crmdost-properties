import { redirect } from 'next/navigation';

type Props = {
  params: {
    uid: string;
  };
};

export default function LegacyCompanyAliasPage({ params }: Props) {
  redirect(`/company/${params.uid}`);
}
