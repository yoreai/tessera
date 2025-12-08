import { NextRequest, NextResponse } from 'next/server'
import { 
  sampleDrugReviews, 
  sampleMedicalTranscriptions, 
  samplePubMedAbstracts 
} from '@/lib/demo-data'

// Demo mode for Vercel deployment
const DEMO_MODE = process.env.ARESADB_DEMO !== 'false'

// Simple similarity scoring for demo (just keyword matching)
function demoSimilarity(text: string, query: string): number {
  const queryWords = query.toLowerCase().split(/\s+/)
  const textLower = text.toLowerCase()
  let matches = 0
  for (const word of queryWords) {
    if (textLower.includes(word)) matches++
  }
  return 0.5 + (matches / queryWords.length) * 0.5
}

export async function POST(request: NextRequest) {
  try {
    const {
      query,
      table = 'medical_transcriptions',
      topK = 10,
      metric = 'cosine'
    } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const startTime = performance.now()

    // Demo mode: Return sample vector search results
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
      
      let sourceData: any[] = []
      let textField = 'text'

      if (table === 'medical_transcriptions' || table.includes('transcription')) {
        sourceData = sampleMedicalTranscriptions.map(t => ({
          ...t,
          text: t.transcription,
          similarity: demoSimilarity(t.transcription + ' ' + t.description, query)
        }))
        textField = 'transcription'
      } else if (table === 'drug_reviews' || table.includes('drug')) {
        sourceData = sampleDrugReviews.map(r => ({
          ...r,
          text: r.review,
          similarity: demoSimilarity(r.review + ' ' + r.drug_name + ' ' + r.condition, query)
        }))
        textField = 'review'
      } else if (table === 'pubmed_abstracts' || table.includes('pubmed')) {
        sourceData = samplePubMedAbstracts.map(p => ({
          ...p,
          text: p.abstract,
          similarity: demoSimilarity(p.abstract + ' ' + p.title, query)
        }))
        textField = 'abstract'
      } else {
        // Default to transcriptions
        sourceData = sampleMedicalTranscriptions.map(t => ({
          ...t,
          text: t.transcription,
          similarity: demoSimilarity(t.transcription, query)
        }))
      }

      // Sort by similarity and take topK
      const results = sourceData
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map((item, idx) => ({
          rank: idx + 1,
          id: item.id,
          similarity: Math.round(item.similarity * 1000) / 1000,
          [textField]: item.text?.substring(0, 200) + '...',
          metadata: { ...item, text: undefined, similarity: undefined }
        }))

      return NextResponse.json({
        success: true,
        results,
        executionTime: performance.now() - startTime,
        count: results.length,
        query,
        metric,
        table,
        demo: true,
      })
    }

    // Production mode: Use AresaDB CLI
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    const ARESADB_PATH = process.env.ARESADB_PATH || '../../../tools/aresadb/target/release/aresadb'
    const DB_PATH = process.env.ARESADB_DB_PATH || '/tmp/aresadb-studio-demo'

    const cmd = `${ARESADB_PATH} --db ${DB_PATH} search "${query.replace(/"/g, '\\"')}" --table ${table} --top-k ${topK} --metric ${metric} --format json`

    try {
      const { stdout } = await execAsync(cmd, {
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      })

      let results
      try {
        results = JSON.parse(stdout)
      } catch {
        results = []
      }

      return NextResponse.json({
        success: true,
        results,
        executionTime: performance.now() - startTime,
        count: results.length,
        query,
        metric,
      })
    } catch (execError: any) {
      return NextResponse.json({
        success: false,
        error: execError.stderr || execError.message,
        executionTime: performance.now() - startTime,
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Vector search API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

