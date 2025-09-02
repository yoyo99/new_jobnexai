import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import pdfMake from 'npm:pdfmake@0.2.10'
import { TDocumentDefinitions } from 'npm:@types/pdfmake@0.2.9'
import { verify } from 'npm:djwt@3.0.1'
import { Status } from 'https://deno.land/std@0.177.0/http/http_status.ts'
import { isHttpError } from 'https://deno.land/std@0.177.0/http/http_errors.ts';



const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CVSection {
  type: CVSectionType
  title: string
  content: any
}

enum CVSectionType {
    HEADER = 'header',
    EXPERIENCE = 'experience',
    EDUCATION = 'education',
    SKILLS = 'skills',
    PROJECTS = 'projects'
}

interface CV {
  id: string
  template_id: string
  sections: CVSection[]
  language: string
}

const STANDARD_TEMPLATE_STYLE = {
  header: {
    fontSize: 24,
    bold: true,
    margin: [0, 0, 0, 10],
  },
  subheader: {
    fontSize: 18,
    margin: [0, 0, 0, 5],
  },
  sectionHeader: {
    fontSize: 14,
    bold: true,
    margin: [0, 15, 0, 10],
  },
  contact: {
    fontSize: 10,
    color: '#666666',
  },
}

interface TemplateStyle {
    [key: string]: any;
}
interface ResponseBody {
  pdf?: string;
  error?: string;
  message?: string;
}

const JWT_SECRET = Deno.env.get("JWT_SECRET")!;

async function validateInput(data: any): Promise<string> {
  if (!data.cv_id) {
    throw new Error('cv_id is required')
  }

  if (typeof data.cv_id !== 'string') {
    throw new Error('cv_id must be a string')
  }

  return data.cv_id
}

async function verifyJWT(req: Request): Promise<string> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Authorization header is missing')
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    throw new Error('Token is missing')
  }

  try {
    const payload = await verify(token, JWT_SECRET, 'HS512')
    if (typeof payload !== "object" || payload === null || !payload.sub) {
        throw new Error("Invalid token payload");
    }
    return payload.sub
  } catch (error) {
    throw new Error('Invalid token')
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let response: ResponseBody = {}
  let status = 200

  try {
    const userId = await verifyJWT(req);
    await verifyJWT(req);

    const data = await req.json()

    const cv_id = await validateInput(data)

    // Get CV data
    const { data: cv, error: cvError } = await supabase
      .from('user_cvs')
      .select(`
        *,
        template:cv_templates(*),
        sections:cv_sections(*)
      `)
      .eq('id', cv_id)
      .single()

    if (cvError) {
        console.error('Supabase Error:', cvError);
        throw new Error("Error while fetching the CV")
    }

    if (!cv) {
        console.error('CV not found:', cv_id);
        throw new Error("CV not found");
    }

    // Get template style
    const templateStyle = getTemplateStyle(cv.template.category)

    // Create PDF definition
    const docDefinition: TDocumentDefinitions = {
      content: [],
      defaultStyle: {
        font: 'Helvetica',
      },
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      info: {
        title: 'CV',
      },
      styles: templateStyle.styles,
    }

    // Add header
    if (cv.sections.find(s => s.type === CVSectionType.HEADER)) {
      const header = cv.sections.find(s => s.type === 'header')
      docDefinition.content.push({
        stack: [
          { text: header.content.name, style: 'header' },
          { text: header.content.title, style: 'subheader' },
          {
            columns: [
              { text: header.content.email, style: 'contact' },
              { text: header.content.phone, style: 'contact' },
              { text: header.content.location, style: 'contact' },
            ],
          },
        ],
        margin: [0, 0, 0, 20],
      })
    }

    // Add other sections
    cv.sections
      .filter(s => s.type !== CVSectionType.HEADER)
      .sort((a, b) => a.order_index - b.order_index)
      .forEach(section => {
        docDefinition.content.push(
          { text: section.title, style: 'sectionHeader' },
          getSectionContent(section),
          { text: '', margin: [0, 10] }
        )
      })

    // Generate PDF
    try {
        const pdfDoc = pdfMake.createPdf(docDefinition);

        const pdfBase64 = await new Promise<string>((resolve, reject) => {
          pdfDoc.getBase64((data: string) => {
            if (data) {
                resolve(data);
            } else {
                reject(new Error('Failed to generate PDF data'));
            }
          });
        });
        response = { pdf: pdfBase64 }
    } catch (pdfError) {
        console.error('pdfMake Error:', pdfError);
        throw new Error("Error while generating the PDF")
    }



    status = Status.OK

  } catch (error) {
    console.error('Error generating PDF:', error);
    response = {
      error: error.message,
    }
    if (error.message === 'Authorization header is missing' || error.message === "Invalid token" || error.message === "Token is missing"){        
        status = Status.Unauthorized;
    } else if (isHttpError(error)){
        status = error.status;
    } else {
        status = Status.BadRequest;
    }
  }
  return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      });
  }
});

const CREATIVE_TEMPLATE_STYLE: TemplateStyle = {
    header: {
        fontSize: 28,
        bold: true,
        color: '#2563eb',
        margin: [0, 0, 0, 10],
    },
    subheader: {
        fontSize: 20,
        color: '#4b5563',
        margin: [0, 0, 0, 5],
    },
    sectionHeader: {
        fontSize: 16,
        bold: true,
        color: '#2563eb',
        margin: [0, 20, 0, 10],
    },
    contact: {
        fontSize: 12,
        color: '#4b5563',
    },
}

const FREELANCE_TEMPLATE_STYLE: TemplateStyle = {
    header: {
        fontSize: 26,
        bold: true,
        color: '#059669',
        margin: [0, 0, 0, 10],
    },
    subheader: {
        fontSize: 19,
        color: '#374151',
        margin: [0, 0, 0, 5],
    },
    sectionHeader: {
        fontSize: 15,
        bold: true,
        color: '#059669',
        margin: [0, 20, 0, 10],
    },
    contact: {
        fontSize: 11,
        color: '#374151',
    },
}

function getSectionContent(section: CVSection) {
    switch (section.type) {
        case CVSectionType.EXPERIENCE:
            return section.content.items.map(item => ({
                stack: [
                    {
                        columns: [
                            { text: item.title, bold: true },
                            { text: item.date, alignment: 'right' },
                        ],
                    },
                    {
                        columns: [
                            { text: item.company },
                            { text: item.location, alignment: 'right' },
                        ],
                        margin: [0, 2],
                    },
                    { text: item.description, margin: [0, 5] },
                ],
                margin: [0, 0, 0, 10],
            }))

        case CVSectionType.EDUCATION:
      return section.content.items.map(item => ({
        stack: [
          {
            columns: [
              { text: item.degree, bold: true },
              { text: item.date, alignment: 'right' },
            ],
          },
          {
            columns: [
              { text: item.school },
              { text: item.location, alignment: 'right' },
            ],
            margin: [0, 2],
          },
        ],
        margin: [0, 0, 0, 10],
      }))

        case CVSectionType.SKILLS:
      return {
            columns: section.content.categories.map(category => ({
          stack: [
            { text: category.name, bold: true, margin: [0, 0, 0, 5] },
            { ul: category.skills },
          ],
        })),
      }

        case CVSectionType.PROJECTS:
      return section.content.items.map(item => ({
        stack: [
          { text: item.name, bold: true },
          { text: item.description, margin: [0, 2] },
          { text: item.technologies.join(', '), italics: true, margin: [0, 2] },
        ],
        margin: [0, 0, 0, 10],
      }))

    default:
      return { text: JSON.stringify(section.content, null, 2) }
  }
}

function getTemplateStyle(category: string): { styles: TemplateStyle } {
    const styles: { [key: string]: TemplateStyle } = {
        standard: STANDARD_TEMPLATE_STYLE,
        creative: CREATIVE_TEMPLATE_STYLE,
        freelance: FREELANCE_TEMPLATE_STYLE,
    };

    if (category in styles) {
        return { styles: styles[category] };
    } else {
        return { styles: styles.standard };
    }
}