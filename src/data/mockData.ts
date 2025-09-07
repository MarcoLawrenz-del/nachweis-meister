import { Subcontractor } from '@/types';

export const mockSubcontractors: Subcontractor[] = [
  {
    id: '1',
    name: 'Max Müller',
    company: 'Elektro Müller GmbH',
    email: 'max.mueller@elektro-mueller.de',
    phone: '+49 30 12345678',
    address: 'Musterstraße 123, 10115 Berlin',
    createdAt: '2024-01-15',
    lastUpdated: '2024-03-01',
    documents: {
      freistellungsbescheinigung: {
        status: 'valid',
        expiryDate: '2024-12-31',
        uploadDate: '2024-01-20',
        fileName: 'Freistellung_Mueller_2024.pdf'
      },
      umsatzsteuer: {
        status: 'expiring',
        expiryDate: '2024-04-15',
        uploadDate: '2024-01-18',
        fileName: 'USt_Mueller_2024.pdf'
      },
      sokaBau: {
        status: 'valid',
        expiryDate: '2024-06-30',
        uploadDate: '2024-02-01',
        fileName: 'SOKA_Mueller_2024.pdf'
      },
      bgBau: {
        status: 'expired',
        expiryDate: '2024-02-28',
        uploadDate: '2023-12-15',
        fileName: 'BG_Mueller_2023.pdf'
      },
      handwerksrolle: {
        status: 'valid',
        expiryDate: '2025-01-31',
        uploadDate: '2024-01-10',
        fileName: 'Handwerk_Mueller_2024.pdf'
      },
      a1Bescheinigung: {
        status: 'missing'
      },
      betriebshaftpflicht: {
        status: 'valid',
        expiryDate: '2024-08-15',
        uploadDate: '2024-01-25',
        fileName: 'Haftpflicht_Mueller_2024.pdf'
      }
    }
  },
  {
    id: '2',
    name: 'Anna Schmidt',
    company: 'Sanitär Schmidt & Co KG',
    email: 'a.schmidt@sanitaer-schmidt.de',
    phone: '+49 40 98765432',
    address: 'Hafenstraße 45, 20359 Hamburg',
    createdAt: '2024-02-01',
    lastUpdated: '2024-03-05',
    documents: {
      freistellungsbescheinigung: {
        status: 'expired',
        expiryDate: '2024-02-15',
        uploadDate: '2023-11-20',
        fileName: 'Freistellung_Schmidt_2023.pdf'
      },
      umsatzsteuer: {
        status: 'valid',
        expiryDate: '2024-07-30',
        uploadDate: '2024-02-05',
        fileName: 'USt_Schmidt_2024.pdf'
      },
      sokaBau: {
        status: 'valid',
        expiryDate: '2024-09-15',
        uploadDate: '2024-02-10',
        fileName: 'SOKA_Schmidt_2024.pdf'
      },
      bgBau: {
        status: 'valid',
        expiryDate: '2024-05-31',
        uploadDate: '2024-02-01',
        fileName: 'BG_Schmidt_2024.pdf'
      },
      handwerksrolle: {
        status: 'valid',
        expiryDate: '2025-03-15',
        uploadDate: '2024-02-01',
        fileName: 'Handwerk_Schmidt_2024.pdf'
      },
      a1Bescheinigung: {
        status: 'valid',
        expiryDate: '2024-06-30',
        uploadDate: '2024-02-15',
        fileName: 'A1_Schmidt_2024.pdf'
      },
      betriebshaftpflicht: {
        status: 'expiring',
        expiryDate: '2024-04-30',
        uploadDate: '2024-01-15',
        fileName: 'Haftpflicht_Schmidt_2024.pdf'
      }
    }
  },
  {
    id: '3',
    name: 'Thomas Weber',
    company: 'Malerbetrieb Weber',
    email: 'thomas@malerbetrieb-weber.de',
    phone: '+49 89 11223344',
    address: 'Leopoldstraße 78, 80802 München',
    createdAt: '2024-02-20',
    lastUpdated: '2024-02-25',
    documents: {
      freistellungsbescheinigung: {
        status: 'valid',
        expiryDate: '2024-11-30',
        uploadDate: '2024-02-20',
        fileName: 'Freistellung_Weber_2024.pdf'
      },
      umsatzsteuer: {
        status: 'valid',
        expiryDate: '2024-08-31',
        uploadDate: '2024-02-22',
        fileName: 'USt_Weber_2024.pdf'
      },
      sokaBau: {
        status: 'missing'
      },
      bgBau: {
        status: 'valid',
        expiryDate: '2024-07-15',
        uploadDate: '2024-02-25',
        fileName: 'BG_Weber_2024.pdf'
      },
      handwerksrolle: {
        status: 'valid',
        expiryDate: '2025-02-28',
        uploadDate: '2024-02-20',
        fileName: 'Handwerk_Weber_2024.pdf'
      },
      a1Bescheinigung: {
        status: 'missing'
      },
      betriebshaftpflicht: {
        status: 'valid',
        expiryDate: '2024-10-15',
        uploadDate: '2024-02-21',
        fileName: 'Haftpflicht_Weber_2024.pdf'
      }
    }
  }
];