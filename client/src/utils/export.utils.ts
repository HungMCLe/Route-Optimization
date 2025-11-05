import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { Route, NetworkNode, NetworkEdge } from '../types';

export class ExportUtils {
  /**
   * Export route to PDF
   */
  static exportRouteToPDF(route: Route, filename: string = 'route-plan.pdf') {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text('Route Optimization Report', 14, 22);

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Route ID: ${route.id}`, 14, 36);

    // Summary Box
    doc.setFillColor(240, 245, 255);
    doc.rect(14, 44, 182, 35, 'F');

    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text('Summary', 18, 52);

    doc.setFontSize(10);
    doc.text(`Total Cost: $${route.totalCost.total.toLocaleString()}`, 18, 60);
    doc.text(`Total Time: ${(route.totalTime / 60).toFixed(1)} hours`, 18, 66);
    doc.text(`Total Distance: ${route.totalDistance.toFixed(0)} km`, 18, 72);

    doc.text(`Carbon Emissions: ${route.totalCarbon.toFixed(1)} kg CO₂`, 110, 60);
    doc.text(`Reliability: ${(route.reliability * 100).toFixed(1)}%`, 110, 66);
    doc.text(`Service Level: ${route.serviceLevel.toFixed(1)}%`, 110, 72);

    // Route Segments Table
    doc.setFontSize(14);
    doc.setTextColor(30);
    doc.text('Route Segments', 14, 90);

    const segmentsData = route.segments.map((seg, index) => [
      index + 1,
      seg.from.name,
      seg.to.name,
      seg.mode,
      `${seg.distance.toFixed(0)} km`,
      `${(seg.estimatedTime / 60).toFixed(1)}h`,
      `$${seg.cost.total.toFixed(0)}`,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['#', 'From', 'To', 'Mode', 'Distance', 'Time', 'Cost']],
      body: segmentsData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Cost Breakdown
    const finalY = (doc as any).lastAutoTable.finalY || 95;

    doc.setFontSize(14);
    doc.text('Cost Breakdown', 14, finalY + 15);

    const costData = Object.entries(route.totalCost)
      .filter(([key, value]) => key !== 'currency' && key !== 'total' && value > 0)
      .map(([key, value]) => [
        key.replace(/([A-Z])/g, ' $1').trim(),
        `$${(value as number).toFixed(2)}`,
      ]);

    costData.push(['Total', `$${route.totalCost.total.toFixed(2)}`]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Cost Category', 'Amount']],
      body: costData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Footnote
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(filename);
  }

  /**
   * Export route to Excel
   */
  static exportRouteToExcel(route: Route, filename: string = 'route-plan.xlsx') {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Route Optimization Report'],
      [],
      ['Route ID', route.id],
      ['Generated', new Date().toLocaleString()],
      [],
      ['Summary Metrics'],
      ['Total Cost', `$${route.totalCost.total.toLocaleString()}`],
      ['Total Time', `${(route.totalTime / 60).toFixed(1)} hours`],
      ['Total Distance', `${route.totalDistance.toFixed(0)} km`],
      ['Carbon Emissions', `${route.totalCarbon.toFixed(1)} kg CO₂`],
      ['Reliability', `${(route.reliability * 100).toFixed(1)}%`],
      ['Service Level', `${route.serviceLevel.toFixed(1)}%`],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Segments Sheet
    const segmentsData = [
      ['Segment', 'From', 'To', 'Mode', 'Distance (km)', 'Time (min)', 'Cost ($)', 'Carbon (kg)'],
      ...route.segments.map((seg, index) => [
        index + 1,
        seg.from.name,
        seg.to.name,
        seg.mode,
        seg.distance.toFixed(2),
        seg.estimatedTime.toFixed(0),
        seg.cost.total.toFixed(2),
        seg.carbonEmissions.toFixed(2),
      ]),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(segmentsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Segments');

    // Cost Breakdown Sheet
    const costData = [
      ['Cost Category', 'Amount ($)'],
      ...Object.entries(route.totalCost)
        .filter(([key, value]) => key !== 'currency' && key !== 'total' && value > 0)
        .map(([key, value]) => [key.replace(/([A-Z])/g, ' $1').trim(), (value as number).toFixed(2)]),
      ['Total', route.totalCost.total.toFixed(2)],
    ];

    const ws3 = XLSX.utils.aoa_to_sheet(costData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Cost Breakdown');

    XLSX.writeFile(wb, filename);
  }

  /**
   * Export route to JSON
   */
  static exportRouteToJSON(route: Route, filename: string = 'route-plan.json') {
    const blob = new Blob([JSON.stringify(route, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export network to various formats
   */
  static exportNetwork(
    nodes: NetworkNode[],
    edges: NetworkEdge[],
    format: 'json' | 'csv' | 'excel'
  ) {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'json':
        const jsonData = { nodes, edges };
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `network-${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
        break;

      case 'csv':
        // Export nodes as CSV
        const nodesCsv = [
          ['ID', 'Name', 'Type', 'Latitude', 'Longitude', 'Capacity', 'Fixed Costs'].join(','),
          ...nodes.map((n) =>
            [
              n.id,
              n.name,
              n.type,
              n.coordinates.lat,
              n.coordinates.lng,
              n.capacity || '',
              n.fixedCosts || '',
            ].join(',')
          ),
        ].join('\n');

        const nodesBlob = new Blob([nodesCsv], { type: 'text/csv' });
        const nodesUrl = URL.createObjectURL(nodesBlob);
        const nodesLink = document.createElement('a');
        nodesLink.href = nodesUrl;
        nodesLink.download = `nodes-${timestamp}.csv`;
        nodesLink.click();

        // Export edges as CSV
        const edgesCsv = [
          [
            'ID',
            'Source',
            'Target',
            'Mode',
            'Distance',
            'Base Time',
            'Base Cost',
            'Capacity',
            'Reliability',
            'Carbon Emissions',
          ].join(','),
          ...edges.map((e) =>
            [
              e.id,
              e.source,
              e.target,
              e.mode,
              e.distance,
              e.baseTime,
              e.baseCost,
              e.capacity,
              e.reliability,
              e.carbonEmissions,
            ].join(',')
          ),
        ].join('\n');

        const edgesBlob = new Blob([edgesCsv], { type: 'text/csv' });
        const edgesUrl = URL.createObjectURL(edgesBlob);
        const edgesLink = document.createElement('a');
        edgesLink.href = edgesUrl;
        edgesLink.download = `edges-${timestamp}.csv`;
        edgesLink.click();
        break;

      case 'excel':
        const wb = XLSX.utils.book_new();

        // Nodes sheet
        const nodesData = [
          ['ID', 'Name', 'Type', 'Latitude', 'Longitude', 'Capacity', 'Fixed Costs'],
          ...nodes.map((n) => [
            n.id,
            n.name,
            n.type,
            n.coordinates.lat,
            n.coordinates.lng,
            n.capacity || '',
            n.fixedCosts || '',
          ]),
        ];

        const ws1 = XLSX.utils.aoa_to_sheet(nodesData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Nodes');

        // Edges sheet
        const edgesData = [
          [
            'ID',
            'Source',
            'Target',
            'Mode',
            'Distance',
            'Base Time',
            'Base Cost',
            'Capacity',
            'Reliability',
            'Carbon Emissions',
          ],
          ...edges.map((e) => [
            e.id,
            e.source,
            e.target,
            e.mode,
            e.distance,
            e.baseTime,
            e.baseCost,
            e.capacity,
            e.reliability,
            e.carbonEmissions,
          ]),
        ];

        const ws2 = XLSX.utils.aoa_to_sheet(edgesData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Edges');

        XLSX.writeFile(wb, `network-${timestamp}.xlsx`);
        break;
    }
  }

  /**
   * Export performance metrics
   */
  static exportMetrics(metrics: any[], format: 'json' | 'csv' | 'excel') {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'json':
        const blob = new Blob([JSON.stringify(metrics, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metrics-${timestamp}.json`;
        a.click();
        URL.revokeObjectURL(url);
        break;

      case 'csv':
        if (metrics.length === 0) return;

        const headers = Object.keys(metrics[0]);
        const csv = [
          headers.join(','),
          ...metrics.map((m) => headers.map((h) => m[h]).join(',')),
        ].join('\n');

        const csvBlob = new Blob([csv], { type: 'text/csv' });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvLink = document.createElement('a');
        csvLink.href = csvUrl;
        csvLink.download = `metrics-${timestamp}.csv`;
        csvLink.click();
        break;

      case 'excel':
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(metrics);
        XLSX.utils.book_append_sheet(wb, ws, 'Metrics');
        XLSX.writeFile(wb, `metrics-${timestamp}.xlsx`);
        break;
    }
  }
}
