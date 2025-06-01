import { NextResponse } from "next/server"
import { executeQueryWithTiming } from "@/lib/db"

export async function GET() {
  try {
    const query = `
      SELECT c_name
      FROM customer
      ORDER BY c_name
    `

    const result = await executeQueryWithTiming(query)

    if (result.success) {
      const names = result.data.map((row: { c_name: string }) => row.c_name)
      return NextResponse.json(names)
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
