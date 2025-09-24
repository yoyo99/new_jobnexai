import { Document, HeadingLevel, Paragraph, Table, TableRow, TableCell, TextRun, AlignmentType } from 'docx';
import { format } from 'date-fns';

export type ApplicationStatus = 'pending' | 'rejected' | 'interview' | 'accepted';
export type ApplicationMethod = 'online' | 'email' | 'post' | 'network' | 'other';

export interface JobApplication {
  company_name: string;
  job_title: string;
  application_date: string; // ISO string
  application_method: ApplicationMethod;
  status: ApplicationStatus;
  location?: string;
  contract_type?: string;
  notes?: string;
}

export interface MonthlySummary {
  month: number; // 1-12
  year: number;
  applications: JobApplication[];
  trainings?: string[];
  networking_events?: string[];
  personal_projects?: string[];
}

export interface PoleEmploiLetterData {
  user_info: {
    lastname: string;
    firstname: string;
    address: string;
    postal_code?: string;
    city?: string;
    pole_emploi_id: string;
  };
  period: [number, number]; // [month, year]
  summary: MonthlySummary;
  template_type?: 'standard' | 'detailed';
}

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'En attente',
  rejected: 'Refus',
  interview: 'Entretien',
  accepted: 'Accepté',
};

const METHOD_LABELS: Record<ApplicationMethod, string> = {
  online: 'En ligne',
  email: 'Email',
  post: 'Courrier',
  network: 'Réseau',
  other: 'Autre',
};

function formatMonthYear(month: number, year: number): string {
  const date = new Date(year, month - 1, 1);
  return format(date, 'MMMM yyyy');
}

function createParagraph(text: string, bold = false, spacingAfter = 200): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text, bold }),
    ],
    spacing: { after: spacingAfter },
  });
}

function createListParagraph(label: string, value?: string, boldLabel = true): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label} : `, bold: boldLabel }),
      new TextRun({ text: value ?? 'Aucun' }),
    ],
    spacing: { after: 100 },
  });
}

function buildApplicationsTable(applications: JobApplication[]): Table {
  const headerRow = new TableRow({
    children: [
      'Date',
      'Entreprise',
      'Poste',
      'Méthode',
      'Statut',
    ].map((text) => new TableCell({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true })],
      })],
    })),
  });

  const rows = applications.map((app) => new TableRow({
    children: [
      format(new Date(app.application_date), 'dd/MM/yyyy'),
      app.company_name,
      app.job_title,
      METHOD_LABELS[app.application_method] ?? app.application_method,
      STATUS_LABELS[app.status] ?? app.status,
    ].map((text) => new TableCell({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text })],
      })],
    })),
  }));

  return new Table({
    rows: [headerRow, ...rows],
    width: { size: 100, type: "pct" },
  });
}

export async function generatePoleEmploiDocument(data: PoleEmploiLetterData): Promise<Uint8Array> {
  const { user_info, period, summary } = data;
  const [month, year] = period;
  const monthYear = formatMonthYear(month, year);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: `${user_info.lastname} ${user_info.firstname}`, bold: true })],
        }),
        createParagraph(`${user_info.address}${user_info.postal_code && user_info.city ? `, ${user_info.postal_code} ${user_info.city}` : ''}`),
        createParagraph(`Identifiant Pôle Emploi : ${user_info.pole_emploi_id}`),
        createParagraph(''),
        createParagraph(`À l'attention de Monsieur le Directeur`, true),
        createParagraph(`Pôle Emploi - Agence de ${user_info.city ?? 'votre secteur'}`),
        createParagraph(''),
        createParagraph(`Objet : Justificatif de recherches d'emploi - ${monthYear}`, true),
        createParagraph(''),
        new Paragraph({
          children: [
            new TextRun(`Monsieur le Directeur,

Conformément à mes obligations en tant que demandeur d'emploi, vous trouverez ci-dessous le récapitulatif de mes démarches de recherche d'emploi pour le mois de ${monthYear}.
`),
          ],
          spacing: { after: 200 },
        }),
        createListParagraph('Candidatures envoyées', `${summary.applications.length}`),
        createListParagraph('Formations suivies', summary.trainings?.join(', ')),
        createListParagraph('Événements networking', summary.networking_events?.join(', ')),
        createListParagraph('Projets personnels', summary.personal_projects?.join(', ')),
        createParagraph(''),
        createParagraph('Détail des candidatures :', true, 150),
        buildApplicationsTable(summary.applications),
        createParagraph(''),
        new Paragraph({
          children: [
            new TextRun(`Je reste à votre disposition pour tout complément d'information et vous prie d'agréer, Monsieur le Directeur, l'expression de mes salutations distinguées.`),
          ],
          spacing: { after: 200 },
        }),
        createParagraph(`${user_info.firstname} ${user_info.lastname}`, true, 200),
      ],
    }],
  });

  return await doc.pack();
}
