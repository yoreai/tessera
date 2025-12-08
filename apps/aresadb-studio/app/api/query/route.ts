import { NextRequest, NextResponse } from 'next/server'
import { 
  sampleDrugReviews, 
  sampleMedicalTranscriptions, 
  sampleHeartDisease, 
  samplePubMedAbstracts,
  datasetStats 
} from '@/lib/demo-data'

// Demo mode for Vercel deployment
const DEMO_MODE = process.env.ARESADB_DEMO !== 'false'

export async function POST(request: NextRequest) {
  try {
    const { query, format = 'json' } = await request.json()

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const startTime = performance.now()
    const lowerQuery = query.toLowerCase()

    // Demo mode: Return sample data based on query
    if (DEMO_MODE) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 150))
      
      let results: any[] = []
      let tableName = 'unknown'

      if (lowerQuery.includes('drug') || lowerQuery.includes('review') || lowerQuery.includes('medication')) {
        results = sampleDrugReviews
        tableName = 'drug_reviews'
      } else if (lowerQuery.includes('transcription') || lowerQuery.includes('clinical') || lowerQuery.includes('specialty')) {
        results = sampleMedicalTranscriptions
        tableName = 'medical_transcriptions'
      } else if (lowerQuery.includes('heart') || lowerQuery.includes('disease') || lowerQuery.includes('cardio')) {
        results = sampleHeartDisease
        tableName = 'heart_disease'
      } else if (lowerQuery.includes('pubmed') || lowerQuery.includes('abstract') || lowerQuery.includes('paper') || lowerQuery.includes('research')) {
        results = samplePubMedAbstracts
        tableName = 'pubmed_abstracts'
      } else if (lowerQuery.includes('select *') || lowerQuery.includes('from')) {
        // Try to detect table from query
        if (lowerQuery.includes('drug')) results = sampleDrugReviews
        else if (lowerQuery.includes('transcription')) results = sampleMedicalTranscriptions
        else if (lowerQuery.includes('heart')) results = sampleHeartDisease
        else results = sampleDrugReviews // default
        tableName = 'detected_table'
      } else {
        // Default to drug reviews
        results = sampleDrugReviews
        tableName = 'drug_reviews'
      }

      // Handle LIMIT clause
      const limitMatch = lowerQuery.match(/limit\s+(\d+)/i)
      if (limitMatch) {
        const limit = parseInt(limitMatch[1])
        results = results.slice(0, limit)
      }

      const executionTime = performance.now() - startTime

      return NextResponse.json({
        success: true,
        results,
        executionTime,
        rowCount: results.length,
        demo: true,
        table: tableName,
      })
    }

    // Production mode: Use AresaDB CLI
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    const ARESADB_PATH = process.env.ARESADB_PATH || '../../../tools/aresadb/target/release/aresadb'
    const DB_PATH = process.env.ARESADB_DB_PATH || '/tmp/aresadb-studio-demo'

    const cmd = `${ARESADB_PATH} --db ${DB_PATH} query "${query.replace(/"/g, '\\"')}" --format ${format}`

    try {
      const { stdout } = await execAsync(cmd, {
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
      })

      let results
      if (format === 'json') {
        try {
          results = JSON.parse(stdout)
        } catch {
          results = stdout
        }
      } else {
        results = stdout
      }

      return NextResponse.json({
        success: true,
        results,
        executionTime: performance.now() - startTime,
        rowCount: Array.isArray(results) ? results.length : 1,
      })
    } catch (execError: any) {
      return NextResponse.json({
        success: false,
        error: execError.stderr || execError.message,
        executionTime: performance.now() - startTime,
      }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Query API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  if (DEMO_MODE) {
    return NextResponse.json({
      status: 'connected',
      database: 'demo-healthcare-ml',
      datasets: Object.keys(datasetStats),
      demo: true,
      info: 'AresaDB Studio Demo Mode - Healthcare ML Datasets',
    })
  }

  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    const ARESADB_PATH = process.env.ARESADB_PATH || '../../../tools/aresadb/target/release/aresadb'
    const DB_PATH = process.env.ARESADB_DB_PATH || '/tmp/aresadb-studio-demo'
    
    const cmd = `${ARESADB_PATH} --db ${DB_PATH} status`
    const { stdout } = await execAsync(cmd, { timeout: 5000 })

    return NextResponse.json({
      status: 'connected',
      database: DB_PATH,
      info: stdout.trim(),
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'disconnected',
      error: error.message,
    }, { status: 503 })
  }
}

