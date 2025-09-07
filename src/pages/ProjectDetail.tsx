import { useParams } from 'react-router-dom';

export default function ProjectDetail() {
  const { id } = useParams();
  
  return (
    <div>
      <h1 className="text-3xl font-bold">Projekt Details</h1>
      <p>Projekt ID: {id}</p>
    </div>
  );
}