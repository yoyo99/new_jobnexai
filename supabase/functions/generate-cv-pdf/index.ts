import { createClient } from 'npm:@supabase/supabase-js@2.39.3'
import { PDFDocument, rgb, StandardFonts, PDFFont as _PDFFont } from 'https://esm.sh/pdf-lib@1.17.1';
import { verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts'
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

// --- START: Type Definitions ---
interface HeaderContent {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
}

interface ExperienceItem {
  title: string;
  date: string;
  company: string;
  location: string;
  description: string;
}
interface ExperienceContent {
  items: ExperienceItem[];
}

interface EducationItem {
  degree: string;
  date: string;
  school: string;
  location: string;
}
interface EducationContent {
  items: EducationItem[];
}

interface SkillCategory {
  name: string;
  skills: string[];
}
interface SkillsContent {
  categories: SkillCategory[];
}

interface ProjectItem {
  name: string;
  description: string;
  technologies: string[];
}
interface ProjectsContent {
  items: ProjectItem[];
}

interface CVSectionBase {
  type: CVSectionType;
  title: string;
  order_index: number;
}

interface HeaderSection extends CVSectionBase {
  type: CVSectionType.HEADER;
  content: HeaderContent;
}

interface ExperienceSection extends CVSectionBase {
  type: CVSectionType.EXPERIENCE;
  content: ExperienceContent;
}

interface EducationSection extends CVSectionBase {
  type: CVSectionType.EDUCATION;
  content: EducationContent;
}

interface SkillsSection extends CVSectionBase {
  type: CVSectionType.SKILLS;
  content: SkillsContent;
}

interface ProjectsSection extends CVSectionBase {
  type: CVSectionType.PROJECTS;
  content: ProjectsContent;
}

type CVSection = HeaderSection | ExperienceSection | EducationSection | SkillsSection | ProjectsSection;

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

interface ResponseBody {
  pdf?: string;
  error?: string;
  message?: string;
}

const JWT_SECRET = Deno.env.get("JWT_SECRET")!;

async function prepareKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    return await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign", "verify"],
    );
}

function validateInput(data: any): string {
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
        const key = await prepareKey(JWT_SECRET);
    const payload = await verify(token, key);
    if (typeof payload !== "object" || payload === null || !payload.sub) {
        throw new Error("Invalid token payload");
    }
    return payload.sub
  } catch (_error) {
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
      .eq('user_id', userId)
      .single()

    if (cvError) {
        console.error('Supabase Error:', cvError);
        throw new Error("Error while fetching the CV")
    }

    if (!cv) {
        console.error('CV not found:', cv_id);
        throw new Error("CV not found");
    }


    // Generate PDF with pdf-lib
    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const { width: _width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = height - 60;

      const headerSection = cv.sections.find((s: CVSection): s is HeaderSection => s.type === CVSectionType.HEADER);
      if (headerSection) {
        const header = headerSection.content;
        page.drawText(header.name, { x: 40, y, font: boldFont, size: 24 });
        y -= 30;
        page.drawText(header.title, { x: 40, y, font, size: 18 });
        y -= 20;
        page.drawText(`${header.email} | ${header.phone} | ${header.location}`, { x: 40, y, font, size: 10, color: rgb(0.4, 0.4, 0.4) });
        y -= 40;
      }

      const sections = cv.sections
        .filter((s: CVSection) => s.type !== CVSectionType.HEADER)
        .sort((a: CVSection, b: CVSection) => a.order_index - b.order_index);

      for (const section of sections) {
        if (y < 80) { // Add new page if space is running out
            const newPage = pdfDoc.addPage();
            page = newPage;
            y = page.getSize().height - 60;
        }
        page.drawText(section.title, { x: 40, y, font: boldFont, size: 16, color: rgb(0.02, 0.59, 0.41) });
        y -= 25;
        y = drawSectionContent(page, section, { font, boldFont }, y);
        y -= 20; // Margin after section
      }

      const pdfBytes = await pdfDoc.save();
      const base64String = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
      response = { pdf: base64String };

    } catch (pdfError) {
        console.error('pdf-lib Error:', pdfError);
        throw new Error("Error while generating the PDF")
    }



    status = Status.OK

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    response = {
      error: errorMessage,
    };
    if (errorMessage === 'Authorization header is missing' || errorMessage === "Invalid token" || errorMessage === "Token is missing") {
      status = Status.Unauthorized;
    } else if (isHttpError(error)) {
      status = error.status;
    } else {
      status = Status.BadRequest;
    }
  }
  return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      });
});

// Helper function to draw section content with pdf-lib
function drawSectionContent(page: any, section: CVSection, fonts: { font: any; boldFont: any }, y: number): number {
    let currentY = y;
    const { font, boldFont } = fonts;
    const contentLeft = 50;
    const page_width = page.getSize().width;

    const wrapText = (text: string, maxWidth: number, font: any, size: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        for (const word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const testWidth = font.widthOfTextAtSize(testLine, size);
            if (testWidth > maxWidth) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    switch (section.type) {
        case CVSectionType.EXPERIENCE: {
            for (const item of (section.content as ExperienceContent).items) {
                page.drawText(item.title, { x: contentLeft, y: currentY, font: boldFont, size: 12 });
                const dateWidth = font.widthOfTextAtSize(item.date, 11);
                page.drawText(item.date, { x: page_width - dateWidth - 40, y: currentY, font: font, size: 11, color: rgb(0.3, 0.3, 0.3) });
                currentY -= 18;
                page.drawText(item.company, { x: contentLeft, y: currentY, font: font, size: 11 });
                currentY -= 18;
                if (item.description) {
                    const lines = wrapText(item.description, page_width - 100, font, 10);
                    for (const line of lines) {
                        page.drawText(line, { x: contentLeft + 10, y: currentY, font: font, size: 10 });
                        currentY -= 14;
                    }
                }
                currentY -= 10;
            }
            break;
        }
        case CVSectionType.EDUCATION: {
            for (const item of (section.content as EducationContent).items) {
                page.drawText(item.degree, { x: contentLeft, y: currentY, font: boldFont, size: 12 });
                const dateWidth = font.widthOfTextAtSize(item.date, 11);
                page.drawText(item.date, { x: page_width - dateWidth - 40, y: currentY, font: font, size: 11, color: rgb(0.3, 0.3, 0.3) });
                currentY -= 18;
                page.drawText(item.school, { x: contentLeft, y: currentY, font: font, size: 11 });
                currentY -= 25;
            }
            break;
        }
        case CVSectionType.SKILLS: {
            const skillsContent = section.content as SkillsContent;
            const allSkills = skillsContent.categories.flatMap((category: SkillCategory) => category.skills).join(' · ');
            const lines = wrapText(allSkills, page_width - 100, font, 10);
            for (const line of lines) {
                page.drawText(line, { x: contentLeft, y: currentY, font: font, size: 10 });
                currentY -= 14;
            }
            break;
        }
        case CVSectionType.PROJECTS: {
             for (const item of (section.content as ProjectsContent).items) {
                page.drawText(item.name, { x: contentLeft, y: currentY, font: boldFont, size: 12 });
                currentY -= 18;
                if (item.description) {
                    const lines = wrapText(item.description, page_width - 100, font, 10);
                    for (const line of lines) {
                        page.drawText(line, { x: contentLeft + 10, y: currentY, font: font, size: 10 });
                        currentY -= 14;
                    }
                }
                currentY -= 10;
            }
            break;
        }
    }
    return currentY;
}