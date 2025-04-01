import * as React from "react";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import {
    PDFDownloadLink,
    Document,
    Page,
    Text,
    View,
    StyleSheet
} from "@react-pdf/renderer";
import { cn } from "@/lib/utils/utils";
import { Button, type ButtonProps } from "./button";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

// PDF document styles
const styles = StyleSheet.create({
    page: {
        flexDirection: "column",
        backgroundColor: "#fff",
        padding: 30,
    },
    section: {
        margin: 10,
        padding: 10,
    },
    heading: {
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 10,
    },
    text: {
        fontSize: 12,
        marginBottom: 5,
    },
});

// Define PDF button variants using cva
const pdfButtonVariants = cva(
    "inline-flex items-center justify-center gap-2 transition-colors",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
                outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

// Default PDF Document Component with proper typing
type DefaultPDFDocumentProps = Readonly<{
    title?: string;
    content?: string;
}>;

const DefaultPDFDocument: React.FC<DefaultPDFDocumentProps> = ({
    title = "Document",
    content = "PDF content goes here"
}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.section}>
                <Text style={styles.heading}>{title}</Text>
                <Text style={styles.text}>{content}</Text>
            </View>
        </Page>
    </Document>
);

export type PDFDownloadButtonProps = Readonly<
    Omit<ButtonProps, "onClick" | "children" | "variant"> &
    VariantProps<typeof pdfButtonVariants> & {
        /**
         * The filename for the downloaded PDF (without extension)
         */
        filename: string;

        /**
         * Optional custom PDF Document component
         * Must be a valid @react-pdf/renderer Document component
         */
        document?: React.ReactElement;

        /**
         * Props to pass to the default PDF document if no custom document is provided
         */
        documentProps?: {
            title?: string;
            content?: string;
        };

        /**
         * Optional loading text shown while PDF is being generated
         */
        loadingText?: string;

        /**
         * Optional text for the button
         */
        buttonText?: string;

        /**
         * Whether to show the download icon
         */
        showIcon?: boolean;
    }
>;

export function PDFDownloadButton({
    filename,
    document,
    documentProps,
    loadingText = "Preparing document...",
    buttonText = "Download PDF",
    showIcon = true,
    className,
    variant = "default",
    size = "default",
    ...props
}: PDFDownloadButtonProps) {
    // Use provided document or default document with optional props
    const pdfDocument = document || (
        <DefaultPDFDocument
            title={documentProps?.title}
            content={documentProps?.content}
        />
    );

    return (
        <PDFDownloadLink
            document={pdfDocument}
            fileName={`${filename}.pdf`}
            className={cn("inline-flex", className)}
        >
            {({ loading, error }) => (
                <Button
                    variant={variant}
                    size={size}
                    className={cn(pdfButtonVariants({ variant, size, className }))}
                    disabled={loading || !!error}
                    aria-disabled={loading || !!error}
                    {...props}
                >
                    {loading ? (
                        loadingText
                    ) : (
                        <>
                            {showIcon && <ArrowDownTrayIcon className="size-4" />}
                            {buttonText}
                            {error && <span className="text-destructive">Error</span>}
                        </>
                    )}
                </Button>
            )}
        </PDFDownloadLink>
    );
}