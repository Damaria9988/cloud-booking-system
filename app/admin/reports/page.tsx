"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, TrendingUp, DollarSign, Users, Calendar, Loader2 } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { usePolling } from "@/hooks/use-polling"
import { useSocketIO, type SocketIOMessage } from "@/hooks/use-socketio"
import { toast } from "sonner"
import { PrintInstructionsDialog } from "@/components/print-instructions-dialog"

interface ReportsData {
  stats: {
    totalBookings: number
    totalRevenue: number
    avgTicketPrice: number
    newUsers: number
    bookingsChange: number
    revenueChange: number
    avgPriceChange: number
  }
  dailyPerformance: Array<{
    date: string
    bookings: number
    revenue: number
    avgPrice: number
  }>
  topRoutes: Array<{
    route: string
    bookings: number
    revenue: number
  }>
}

export default function ReportsPage() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState("daily")
  const [dateRange, setDateRange] = useState("all")
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [printInstructions, setPrintInstructions] = useState("")
  const [printCallback, setPrintCallback] = useState<(() => void) | null>(null)

  const fetchReports = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const response = await fetch(`/api/admin/reports?reportType=${reportType}&dateRange=${dateRange}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reports")
      }

      // Ensure change values are numbers
      if (data.stats) {
        data.stats.bookingsChange = Number(data.stats.bookingsChange) || 0
        data.stats.revenueChange = Number(data.stats.revenueChange) || 0
        data.stats.avgPriceChange = Number(data.stats.avgPriceChange) || 0
      }
      setReportsData(data)
      if (showLoading) setLoading(false)
    } catch (err: any) {
      console.error("Error fetching reports:", err)
      toast.error(err.message || "Failed to fetch reports data")
      if (showLoading) setLoading(false)
    }
  }, [reportType, dateRange])

  // Handle real-time booking updates via Socket.IO
  const handleMessage = useCallback((message: SocketIOMessage) => {
    // Refresh reports when new booking is created or cancelled
    if (message.type === 'new_booking' || message.type === 'booking_cancelled') {
      fetchReports(false)
    }
  }, [fetchReports])

  const { subscribe, unsubscribe, isConnected } = useSocketIO({
    autoConnect: true,
    autoReconnect: true,
    onMessage: handleMessage,
    showToastNotifications: false,
  })

  // Subscribe to admin channel for real-time updates
  useEffect(() => {
    if (isConnected) {
      subscribe('admin:bookings')
      return () => unsubscribe('admin:bookings')
    }
  }, [isConnected, subscribe, unsubscribe])

  useEffect(() => {
    fetchReports(true)
  }, [fetchReports])

  // Polling every 10 seconds as fallback
  usePolling(fetchReports, { interval: 10000 })

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 1000).toFixed(0)}K`
    }
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change}%`
  }

  const handleExportCSV = () => {
    if (!reportsData) {
      toast.error("No data available to export")
      return
    }

    try {
      // Create CSV content
      let csvContent = "Reports & Analytics\n"
      csvContent += `Generated: ${new Date().toLocaleString()}\n`
      csvContent += `Date Range: ${dateRange}\n`
      csvContent += `Report Type: ${reportType}\n\n`

      // Summary Stats
      csvContent += "Summary Statistics\n"
      csvContent += `Total Bookings,${reportsData.stats.totalBookings}\n`
      csvContent += `Total Revenue,${reportsData.stats.totalRevenue}\n`
      csvContent += `Avg. Ticket Price,${reportsData.stats.avgTicketPrice}\n`
      csvContent += `New Users,${reportsData.stats.newUsers}\n`
      csvContent += `Bookings Change,${formatChange(reportsData.stats.bookingsChange || 0)}\n`
      csvContent += `Revenue Change,${formatChange(reportsData.stats.revenueChange || 0)}\n`
      csvContent += `Avg Price Change,${formatChange(reportsData.stats.avgPriceChange || 0)}\n\n`

      // Daily Performance
      csvContent += "Daily Performance\n"
      csvContent += "Date,Bookings,Revenue,Avg. Price\n"
      if (reportsData.dailyPerformance.length > 0) {
        reportsData.dailyPerformance.forEach((day) => {
          csvContent += `${day.date},${day.bookings},${day.revenue},${day.avgPrice}\n`
        })
      } else {
        csvContent += "No data available\n"
      }
      csvContent += "\n"

      // Top Routes
      csvContent += "Top Performing Routes\n"
      csvContent += "Route,Bookings,Revenue\n"
      if (reportsData.topRoutes.length > 0) {
        reportsData.topRoutes.forEach((route) => {
          // Escape quotes in route names
          const routeName = route.route.replace(/"/g, '""')
          csvContent += `"${routeName}",${route.bookings},${route.revenue}\n`
        })
      } else {
        csvContent += "No data available\n"
      }

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      const fileName = `reports_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`
      link.setAttribute("download", fileName)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success("CSV file downloaded successfully")
    } catch (error: any) {
      console.error("Error exporting CSV:", error)
      toast.error("Failed to export CSV file")
    }
  }

  const handleExportPDF = () => {
    if (!reportsData) {
      toast.error("No data available to export")
      return
    }

    // Set document title to use as PDF filename
    const fileName = `Reports_${dateRange}_${new Date().toISOString().split('T')[0]}`
    const originalTitle = document.title
    document.title = fileName
    
    // Update title tag directly
    const titleTag = document.querySelector('title')
    if (titleTag) {
      titleTag.textContent = fileName
    }

    // Use browser's native print-to-PDF feature
    const userAgent = navigator.userAgent.toLowerCase()
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge')
    const isFirefox = userAgent.includes('firefox')
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
    const isEdge = userAgent.includes('edge')
    
    // Show helpful instructions based on browser
    let instructions = ''
    if (isChrome || isEdge) {
      instructions = `IMPORTANT: To remove "Reports" and URL text from PDF:\n\n1. In the print dialog, click "More settings"\n2. UNCHECK "Headers and footers" (this removes unwanted text)\n3. Select "Save as PDF" or "Microsoft Print to PDF" as destination\n4. The filename will be "${fileName}.pdf"\n5. Click "Save" and choose location`
    } else if (isFirefox) {
      instructions = `IMPORTANT: To remove "Reports" and URL text from PDF:\n\n1. In the print dialog, click "More Settings"\n2. UNCHECK "Print headers and footers" (this removes unwanted text)\n3. Select "Print to File" or "Save to PDF"\n4. The filename will be "${fileName}.pdf"\n5. Choose location and click "Save"`
    } else if (isSafari) {
      instructions = `To save as PDF on Mac:\n1. In the print dialog, click the PDF dropdown\n2. Select "Save as PDF"\n3. The filename will be "${fileName}.pdf"\n4. Choose location and click "Save"\n\nNote: In Safari, headers/footers are usually disabled by default.`
    } else {
      instructions = `IMPORTANT: To remove "Reports" and URL text from PDF:\n\n1. In the print dialog, disable "Headers and footers" in settings\n2. Look for "Save as PDF" or "Print to File" option\n3. The filename will be "${fileName}.pdf"\n4. Select it and choose where to save\n5. Click Save`
    }
    
    // Show instructions dialog
    setPrintInstructions(instructions)
    setPrintCallback(() => {
      // This will be called when user clicks "Open Print Dialog"
      // Capture variables in closure
      const currentReportsData = reportsData
      const currentDateRange = dateRange
      const currentReportType = reportType
      
      if (!currentReportsData) {
        toast.error("No data available to export")
        document.title = originalTitle
        if (titleTag) {
          titleTag.textContent = originalTitle
        }
        return
      }
      
      try {
      // Create a printable HTML content
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        toast.error("Please allow pop-ups to download PDF")
        // Restore title
        document.title = originalTitle
        if (titleTag) {
          titleTag.textContent = originalTitle
        }
        return
      }

      const dailyPerformanceRows = currentReportsData.dailyPerformance.length > 0
        ? currentReportsData.dailyPerformance.map((day) => `
            <tr>
              <td>${day.date}</td>
              <td>${day.bookings}</td>
              <td>₹${day.revenue.toLocaleString('en-IN')}</td>
              <td>₹${day.avgPrice.toLocaleString('en-IN')}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No data available for the selected period</td></tr>`

      const topRoutesRows = currentReportsData.topRoutes.length > 0
        ? currentReportsData.topRoutes.map((route) => `
            <tr>
              <td>${route.route}</td>
              <td>${route.bookings}</td>
              <td>₹${route.revenue.toLocaleString('en-IN')}</td>
            </tr>
          `).join("")
        : `<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">No route data available for the selected period</td></tr>`

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Reports & Analytics - ${new Date().toLocaleDateString()}</title>
            <meta charset="utf-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; 
                padding: 40px; 
                color: #333;
                background: white;
              }
              .header {
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              h1 { 
                color: #111827; 
                font-size: 32px;
                margin-bottom: 10px;
              }
              .meta-info {
                color: #6b7280;
                font-size: 14px;
                margin-top: 10px;
              }
              h2 { 
                color: #374151; 
                margin-top: 40px; 
                margin-bottom: 20px;
                font-size: 24px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 10px;
              }
              table { 
                width: 100%; 
                border-collapse: collapse; 
                margin-top: 20px;
                margin-bottom: 30px;
              }
              th, td { 
                border: 1px solid #e5e7eb; 
                padding: 12px; 
                text-align: left; 
              }
              th { 
                background-color: #f9fafb; 
                font-weight: 600;
                color: #374151;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              .stats { 
                display: grid; 
                grid-template-columns: repeat(2, 1fr); 
                gap: 20px; 
                margin: 20px 0; 
              }
              .stat-card { 
                border: 1px solid #e5e7eb; 
                padding: 20px; 
                border-radius: 8px;
                background: #f9fafb;
              }
              .stat-label { 
                font-size: 14px; 
                color: #6b7280; 
                margin-bottom: 8px;
              }
              .stat-value { 
                font-size: 28px; 
                font-weight: bold; 
                margin: 8px 0;
                color: #111827;
              }
              .stat-change {
                font-size: 12px;
                color: #059669;
                margin-top: 4px;
              }
              @media print { 
                body { padding: 20px; }
                .header { page-break-after: avoid; }
                h2 { page-break-after: avoid; }
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Reports & Analytics</h1>
              <div class="meta-info">
                <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
                  <p><strong>Date Range:</strong> ${currentDateRange}</p>
                <p><strong>Report Type:</strong> ${currentReportType}</p>
              </div>
            </div>

            <h2>Summary Statistics</h2>
            <div class="stats">
              <div class="stat-card">
                <div class="stat-label">Total Bookings</div>
                <div class="stat-value">${currentReportsData.stats.totalBookings}</div>
                <div class="stat-change">${formatChange(currentReportsData.stats.bookingsChange)} from previous period</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Total Revenue</div>
                <div class="stat-value">₹${currentReportsData.stats.totalRevenue.toLocaleString('en-IN')}</div>
                <div class="stat-change">${formatChange(currentReportsData.stats.revenueChange)} from previous period</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Avg. Ticket Price</div>
                <div class="stat-value">₹${currentReportsData.stats.avgTicketPrice.toLocaleString('en-IN')}</div>
                <div class="stat-change">${formatChange(currentReportsData.stats.avgPriceChange)} from previous period</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">New Users</div>
                <div class="stat-value">${currentReportsData.stats.newUsers}</div>
                <div class="stat-change">New customers</div>
              </div>
            </div>

            <h2>Daily Performance</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                  <th>Avg. Price</th>
                </tr>
              </thead>
              <tbody>
                ${dailyPerformanceRows}
              </tbody>
            </table>

            <h2>Top Performing Routes</h2>
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${topRoutesRows}
              </tbody>
            </table>
          </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print dialog
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
        toast.success("PDF ready for download/print")
        // Restore original title after a delay
        setTimeout(() => {
          document.title = originalTitle
          if (titleTag) {
            titleTag.textContent = originalTitle
          }
        }, 2000)
      }, 500)
      } catch (error: any) {
        console.error("Error exporting PDF:", error)
        toast.error("Failed to export PDF file")
        // Restore title on error
        document.title = originalTitle
        if (titleTag) {
          titleTag.textContent = originalTitle
        }
      }
    })
    setPrintDialogOpen(true)
  }
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5">
      <AdminSidebar />
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-balance">Reports & Analytics</h1>
              <p className="text-muted-foreground">Track performance and revenue insights</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="gap-2 bg-transparent"
                onClick={handleExportCSV}
                disabled={loading || !reportsData}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button 
                className="gap-2"
                onClick={handleExportPDF}
                disabled={loading || !reportsData}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label>Report Type</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Report</SelectItem>
                      <SelectItem value="weekly">Weekly Report</SelectItem>
                      <SelectItem value="monthly">Monthly Report</SelectItem>
                      <SelectItem value="yearly">Yearly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label>Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last7">Last 7 Days</SelectItem>
                      <SelectItem value="last30">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex-1 min-w-[200px]">
                  <Label>Category</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                      <SelectItem value="train">Train</SelectItem>
                      <SelectItem value="flight">Flight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reportsData ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Total Bookings</p>
                      <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{reportsData.stats.totalBookings}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {dateRange === "last7" ? "Last 7 days" : dateRange === "last30" ? "Last 30 days" : dateRange === "today" ? "Today" : dateRange === "all" ? "All time" : "Custom range"} • {formatChange(reportsData.stats.bookingsChange)} from previous period
                      </p>
                    </div>
                    <Calendar className="w-12 h-12 text-blue-600 dark:text-blue-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700 dark:text-green-300">Total Revenue</p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">{formatCurrency(reportsData.stats.totalRevenue)}</p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {formatChange(reportsData.stats.revenueChange)} from previous period
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-600 dark:text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Avg. Ticket Price</p>
                      <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">₹{reportsData.stats.avgTicketPrice.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                        {formatChange(reportsData.stats.avgPriceChange)} from previous period
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-purple-600 dark:text-purple-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-700 dark:text-orange-300">New Users</p>
                      <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{reportsData.stats.newUsers}</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">New customers</p>
                    </div>
                    <Users className="w-12 h-12 text-orange-600 dark:text-orange-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Daily Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Performance</CardTitle>
              <CardDescription>Bookings and revenue over the last 5 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Date</th>
                      <th className="text-right p-4 font-semibold">Bookings</th>
                      <th className="text-right p-4 font-semibold">Revenue</th>
                      <th className="text-right p-4 font-semibold">Avg. Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center">
                          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                        </td>
                      </tr>
                    ) : reportsData && reportsData.dailyPerformance.length > 0 ? (
                      reportsData.dailyPerformance.map((day: { date: string; bookings: number; revenue: number; avgPrice: number }, index: number) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-4 font-medium">{day.date}</td>
                          <td className="p-4 text-right">{day.bookings}</td>
                          <td className="p-4 text-right font-semibold">₹{day.revenue.toLocaleString('en-IN')}</td>
                          <td className="p-4 text-right">₹{day.avgPrice.toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          No data available for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Top Routes */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Routes</CardTitle>
              <CardDescription>Most popular routes by bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : reportsData && reportsData.topRoutes.length > 0 ? (
                <div className="space-y-4">
                  {reportsData.topRoutes.map((route: { route: string; bookings: number; revenue: number }, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{route.route}</p>
                        <p className="text-sm text-muted-foreground">{route.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{route.revenue.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-muted-foreground">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No route data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print Instructions Dialog */}
      <PrintInstructionsDialog
        open={printDialogOpen}
        onOpenChange={(open) => {
          setPrintDialogOpen(open)
          // Only handle cleanup if dialog is closing AND callback still exists
          // (meaning user cancelled, since onPrint clears the callback)
          if (!open && printCallback) {
            // User cancelled - restore title and clear callback
            const originalTitle = document.title
            const titleTag = document.querySelector('title')
            if (titleTag) {
              titleTag.textContent = originalTitle
            }
            setPrintCallback(null)
          }
        }}
        instructions={printInstructions}
        onPrint={() => {
          // User clicked "Open Print Dialog" - execute print callback
          // Clear callback FIRST so onOpenChange knows it was print, not cancel
          const callback = printCallback
          setPrintCallback(null)
          
          if (callback) {
            callback()
          }
        }}
      />
    </div>
  )
}
