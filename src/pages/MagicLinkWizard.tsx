import { useParams } from 'react-router-dom';

export default function MagicLinkWizard() {
  const { token } = useParams();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Nachweis-Upload</h1>
        <p>Magic Link Token: {token}</p>
        <p>Wizard wird hier implementiert.</p>
      </div>
    </div>
  );
}