import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'node:stream'

let s3Client: S3Client | null = null

function createS3Client(): S3Client {
  const region = process.env.AWS_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Les variables AWS_REGION, AWS_ACCESS_KEY_ID et AWS_SECRET_ACCESS_KEY doivent être définies pour utiliser S3')
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

export function getS3Client(): S3Client | null {
  if (s3Client) {
    return s3Client
  }

  try {
    s3Client = createS3Client()
    return s3Client
  } catch (error) {
    console.warn('[S3] Client non initialisé:', error)
    return null
  }
}

export async function uploadDocumentToS3(params: {
  bucket: string
  key: string
  body: Buffer | Uint8Array
  contentType?: string
  cacheControl?: string
}): Promise<void> {
  const client = getS3Client()

  if (!client) {
    throw new Error('Client S3 indisponible - vérifiez la configuration AWS')
  }

  const command = new PutObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
    Body: params.body,
    ContentType: params.contentType ?? 'application/octet-stream',
    CacheControl: params.cacheControl ?? 'max-age=31536000',
  })

  await client.send(command)
}

export async function getS3SignedUrl(params: {
  bucket: string
  key: string
  expiresInSeconds?: number
}): Promise<string> {
  const client = getS3Client()

  if (!client) {
    throw new Error('Client S3 indisponible - vérifiez la configuration AWS')
  }

  const command = new GetObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
  })

  const expiresIn = params.expiresInSeconds ?? Number(process.env.S3_SIGNED_URL_EXPIRY_SECONDS ?? 3600)

  return await getSignedUrl(client, command, { expiresIn })
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function getS3ObjectBuffer(params: {
  bucket: string
  key: string
}): Promise<Buffer> {
  const client = getS3Client()

  if (!client) {
    throw new Error('Client S3 indisponible - vérifiez la configuration AWS')
  }

  const command = new GetObjectCommand({
    Bucket: params.bucket,
    Key: params.key,
  })

  const response = await client.send(command)

  if (!response.Body || !(response.Body instanceof Readable)) {
    if (response.Body && typeof (response.Body as any).transformToByteArray === 'function') {
      const byteArray = await (response.Body as any).transformToByteArray()
      return Buffer.from(byteArray)
    }
    throw new Error('Le contenu S3 est vide ou incompatible')
  }

  return await streamToBuffer(response.Body)
}
