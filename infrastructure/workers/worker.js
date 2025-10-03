const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

const WORKER_TYPE = process.env.WORKER_TYPE || 'default';

console.log(`🚀 Starting BullMQ Worker: ${WORKER_TYPE}`);

// =====================================================
// CV EXTRACTION WORKER
// =====================================================
if (WORKER_TYPE === 'cv_extraction') {
  const cvQueue = new Queue('cv-extraction', { connection });
  
  const cvWorker = new Worker('cv-extraction', async (job) => {
    console.log(`📄 Processing CV extraction job ${job.id}`);
    
    const { cvUrl, userId } = job.data;
    
    try {
      // Simulate CV extraction (remplacer par vraie logique)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const extractedData = {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '5 years',
        education: 'Master Computer Science'
      };
      
      // Update progress
      await job.updateProgress(50);
      
      // Save to Supabase
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
      );
      
      await supabase
        .from('cv_extractions')
        .insert({
          user_id: userId,
          cv_url: cvUrl,
          extracted_data: extractedData,
          status: 'completed'
        });
      
      await job.updateProgress(100);
      
      console.log(`✅ CV extraction completed for job ${job.id}`);
      return { success: true, data: extractedData };
      
    } catch (error) {
      console.error(`❌ CV extraction failed for job ${job.id}:`, error);
      throw error;
    }
  }, {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000
    }
  });
  
  cvWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });
  
  cvWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });
}

// =====================================================
// AI ENRICHMENT WORKER
// =====================================================
if (WORKER_TYPE === 'ai_enrichment') {
  const aiQueue = new Queue('ai-enrichment', { connection });
  
  const aiWorker = new Worker('ai-enrichment', async (job) => {
    console.log(`🤖 Processing AI enrichment job ${job.id}`);
    
    const { jobId, jobData } = job.data;
    
    try {
      // Call Mammouth.ai
      const response = await fetch('https://api.mammouth.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MAMMOUTH_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-7b-instruct',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en analyse d\'offres d\'emploi. Enrichis les données.'
            },
            {
              role: 'user',
              content: `Analyse cette offre: ${JSON.stringify(jobData)}`
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });
      
      const result = await response.json();
      const enrichedData = JSON.parse(result.choices[0].message.content);
      
      await job.updateProgress(50);
      
      // Save to Supabase
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
      );
      
      await supabase
        .from('jobs')
        .update({
          enriched: true,
          skills: enrichedData.skills,
          experience_level: enrichedData.experience_level,
          remote_type: enrichedData.remote_type,
          quality_score: enrichedData.quality_score
        })
        .eq('id', jobId);
      
      await job.updateProgress(100);
      
      console.log(`✅ AI enrichment completed for job ${job.id}`);
      return { success: true, data: enrichedData };
      
    } catch (error) {
      console.error(`❌ AI enrichment failed for job ${job.id}:`, error);
      throw error;
    }
  }, {
    connection,
    concurrency: 3,
    limiter: {
      max: 5,
      duration: 1000
    }
  });
  
  aiWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });
  
  aiWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });
}

// =====================================================
// SCRAPING WORKER
// =====================================================
if (WORKER_TYPE === 'scraping') {
  const scrapingQueue = new Queue('scraping', { connection });
  
  const scrapingWorker = new Worker('scraping', async (job) => {
    console.log(`🔍 Processing scraping job ${job.id}`);
    
    const { site, searchParams } = job.data;
    
    try {
      // Simulate scraping (remplacer par vraie logique)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const scrapedJobs = [
        {
          title: 'Developer React',
          company: 'Tech Corp',
          location: 'Paris',
          url: 'https://example.com/job1'
        }
      ];
      
      await job.updateProgress(50);
      
      // Save to Supabase
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY
      );
      
      for (const jobData of scrapedJobs) {
        await supabase
          .from('jobs')
          .insert({
            ...jobData,
            scraping_source: site,
            scraped_at: new Date().toISOString()
          });
      }
      
      await job.updateProgress(100);
      
      console.log(`✅ Scraping completed for job ${job.id}: ${scrapedJobs.length} jobs`);
      return { success: true, count: scrapedJobs.length };
      
    } catch (error) {
      console.error(`❌ Scraping failed for job ${job.id}:`, error);
      throw error;
    }
  }, {
    connection,
    concurrency: 2,
    limiter: {
      max: 3,
      duration: 1000
    }
  });
  
  scrapingWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });
  
  scrapingWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, closing worker...');
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, closing worker...');
  await connection.quit();
  process.exit(0);
});

console.log(`✅ Worker ${WORKER_TYPE} started successfully`);
