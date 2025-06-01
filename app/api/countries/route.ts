import { NextResponse } from "next/server"
import { executeQueryWithTiming } from "@/lib/db"

export async function GET() {
  try {
    const query = `
      SELECT n_name
      FROM nation
      ORDER BY n_name
    `

    const result = await executeQueryWithTiming(query)

    if (result.success) {
      const countries = result.data.map((row: { n_name: string }) => row.n_name)
      return NextResponse.json(countries)
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: `查询出错: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
