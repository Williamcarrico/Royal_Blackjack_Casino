import React from "react";
import { PDFDownloadButton } from "@/components/ui/pdf-download-button";
import {
    Document,
    Page,
    Text,
    View,
    StyleSheet} from "@react-pdf/renderer";

// Custom styles for the receipt document
const receiptStyles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#fff",
        padding: 30,
    },
    header: {
        marginBottom: 20,
        borderBottom: "1px solid #ccc",
        paddingBottom: 10,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
    },
    section: {
        margin: 10,
        padding: 10,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        borderBottom: "1px solid #eee",
        paddingVertical: 8,
    },
    label: {
        width: "60%",
        fontSize: 12,
    },
    value: {
        width: "40%",
        fontSize: 12,
        textAlign: "right",
    },
    total: {
        marginTop: 20,
        paddingTop: 10,
        borderTop: "1px solid #ccc",
        fontWeight: "bold",
    },
    footer: {
        marginTop: 30,
        textAlign: "center",
        fontSize: 10,
        color: "#666",
    },
});

// Example custom PDF document for a receipt
const ReceiptDocument = ({
    orderId = "12345",
    date = new Date().toLocaleDateString(),
    items = [
        { name: "Item 1", price: "$10.00" },
        { name: "Item 2", price: "$15.00" },
        { name: "Item 3", price: "$7.50" },
    ],
    total = "$32.50"
}) => (
    <Document>
        <Page size="A4" style={receiptStyles.page}>
            <View style={receiptStyles.header}>
                <Text style={receiptStyles.headerText}>Royal Casino Receipt</Text>
            </View>

            <View style={receiptStyles.section}>
                <View style={receiptStyles.row}>
                    <Text style={receiptStyles.label}>Order ID:</Text>
                    <Text style={receiptStyles.value}>{orderId}</Text>
                </View>

                <View style={receiptStyles.row}>
                    <Text style={receiptStyles.label}>Date:</Text>
                    <Text style={receiptStyles.value}>{date}</Text>
                </View>
            </View>

            <View style={receiptStyles.section}>
                <Text style={{ fontSize: 14, marginBottom: 10, fontWeight: "bold" }}>Items</Text>

                {items.map((item) => (
                    <View key={`${item.name}-${item.price}`} style={receiptStyles.row}>
                        <Text style={receiptStyles.label}>{item.name}</Text>
                        <Text style={receiptStyles.value}>{item.price}</Text>
                    </View>
                ))}

                <View style={[receiptStyles.row, receiptStyles.total]}>
                    <Text style={receiptStyles.label}>Total</Text>
                    <Text style={receiptStyles.value}>{total}</Text>
                </View>
            </View>

            <View style={receiptStyles.footer}>
                <Text>Thank you for your business!</Text>
                <Text>Royal Casino - Where Fortune Favors the Bold</Text>
            </View>
        </Page>
    </Document>
);

export function PDFDownloadExample() {
    return (
        <div className="p-6 space-y-8 rounded-lg bg-card">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">PDF Download Examples</h2>
                <p className="text-muted-foreground">
                    Examples of the PDFDownloadButton component with different configurations.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Basic example with default PDF template */}
                <div className="flex flex-col p-4 space-y-2 border rounded-md">
                    <h3 className="text-lg font-semibold">Basic Example</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Using the default PDF template with custom title and content.
                    </p>

                    <PDFDownloadButton
                        filename="simple-document"
                        documentProps={{
                            title: "My First PDF",
                            content: "This is a simple PDF generated using the PDFDownloadButton component."
                        }}
                        buttonText="Download Simple PDF"
                    />
                </div>

                {/* Advanced example with custom PDF template */}
                <div className="flex flex-col p-4 space-y-2 border rounded-md">
                    <h3 className="text-lg font-semibold">Custom Receipt</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Using a custom PDF template for a casino receipt.
                    </p>

                    <PDFDownloadButton
                        filename="casino-receipt"
                        document={<ReceiptDocument />}
                        buttonText="Download Receipt"
                        variant="secondary"
                        size="lg"
                    />
                </div>

                {/* Example with different styling */}
                <div className="flex flex-col p-4 space-y-2 border rounded-md">
                    <h3 className="text-lg font-semibold">Custom Styling</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Different button variants and sizes.
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <PDFDownloadButton
                            filename="outline-example"
                            documentProps={{
                                title: "Outline Button PDF",
                                content: "This PDF was downloaded using an outline styled button."
                            }}
                            buttonText="Outline"
                            variant="outline"
                            size="sm"
                        />

                        <PDFDownloadButton
                            filename="ghost-example"
                            documentProps={{
                                title: "Ghost Button PDF",
                                content: "This PDF was downloaded using a ghost styled button."
                            }}
                            buttonText="Ghost"
                            variant="ghost"
                            size="sm"
                        />

                        <PDFDownloadButton
                            filename="destructive-example"
                            documentProps={{
                                title: "Destructive Button PDF",
                                content: "This PDF was downloaded using a destructive styled button."
                            }}
                            buttonText="Destructive"
                            variant="destructive"
                            size="sm"
                        />
                    </div>
                </div>

                {/* Icon only example */}
                <div className="flex flex-col p-4 space-y-2 border rounded-md">
                    <h3 className="text-lg font-semibold">Icon Only</h3>
                    <p className="mb-4 text-sm text-muted-foreground">
                        Button with only the download icon.
                    </p>

                    <PDFDownloadButton
                        filename="icon-only"
                        documentProps={{
                            title: "Icon Only PDF",
                            content: "This PDF was downloaded using an icon-only button."
                        }}
                        buttonText=""
                        size="icon"
                    />
                </div>
            </div>
        </div>
    );
}