import { Button } from '@/components/glint/button';
import { Progress } from '@/components/glint/progress';
import { Card, CardTitle, ConfirmButton, FieldError, Hint } from '@/admin/components/kit';
import { fmt } from '@/admin/lib/format';
import { Download, Icon, TriangleAlert } from '@/icons';
import { router, useForm } from '@inertiajs/react';
import type { FormEventHandler } from 'react';

interface Props {
    placeholders: number;
    maxMb: number;
    importErrors: string[] | null;
    importErrorCount: number;
}

const COLUMNS: [string, string][] = [
    ['sku', 'Matches an existing item, or adds a new one'],
    ['name', 'Needed for new items'],
    ['price', 'Needed for new items. “₱1,250.00” is fine'],
    ['stock', 'Count on hand'],
    ['brand, category', 'For filtering in the shop'],
    ['image', 'A photo URL, or a file name in public/images/products'],
    ['active', '“no” hides the item'],
];

export default function Import({ placeholders, maxMb, importErrors, importErrorCount }: Props) {
    const { data, setData, post, processing, progress, errors, reset } = useForm({ file: null as File | null });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/admin/items/import', { forceFormData: true, onSuccess: () => reset('file') });
    };

    return (
        <div className="grid items-start gap-4 xl:grid-cols-2">
            {importErrors && importErrors.length > 0 && (
                <Card className="xl:col-span-2">
                    <CardTitle>
                        <span className="flex items-center gap-2">
                            <TriangleAlert className="size-4 text-amber-500" /> {fmt(importErrorCount)} rows were skipped
                        </span>
                    </CardTitle>
                    <ul className="max-h-64 list-disc space-y-0.5 overflow-y-auto pl-5 text-sm">
                        {importErrors.map((e) => (
                            <li key={e}>{e}</li>
                        ))}
                    </ul>
                </Card>
            )}

            <Card>
                <CardTitle>Upload a sheet</CardTitle>
                <form onSubmit={submit} className="space-y-4">
                    <label className="border-input hover:border-primary hover:bg-muted/50 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition">
                        <Icon name="upload" className="text-muted-foreground size-8" />
                        <span className="font-medium">{data.file ? data.file.name : 'Choose an .xlsx or .csv file'}</span>
                        <span className="text-muted-foreground text-xs">First sheet only, up to {maxMb.toFixed(1)} MB</span>
                        <input type="file" accept=".xlsx,.csv" required className="sr-only" onChange={(e) => setData('file', e.target.files?.[0] ?? null)} />
                    </label>
                    <FieldError message={errors.file} />
                    {progress && <Progress value={progress.percentage ?? 0} label="Uploading" />}
                    <Button type="submit" loading={processing} disabled={!data.file} startIcon={<Icon name="upload" className="size-4" />}>
                        Upload and apply
                    </Button>
                    {processing && <Hint>Thousands of rows take a minute. Keep this tab open.</Hint>}
                </form>
            </Card>

            <Card className="space-y-3 text-sm leading-relaxed">
                <CardTitle>How the sheet is read</CardTitle>
                <p>
                    Row 1 holds the column names. Only <strong>sku</strong> is required; include just the columns you want to change.
                </p>
                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <tbody>
                            {COLUMNS.map(([col, what]) => (
                                <tr key={col} className="[&>td]:border-b last:[&>td]:border-b-0">
                                    <td className="bg-muted/50 px-4 py-2.5 font-mono text-xs font-semibold whitespace-nowrap">{col}</td>
                                    <td className="px-4 py-2.5">{what}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p>
                    A sheet with only <strong>sku</strong> and <strong>price</strong> is a price update and leaves everything else alone.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    <a href="/admin/items/template">
                        <Button size="sm" variant="outline" startIcon={<Download className="size-4" />}>
                            Template
                        </Button>
                    </a>
                    <a href="/admin/items/export">
                        <Button size="sm" variant="outline" startIcon={<Download className="size-4" />}>
                            Current list
                        </Button>
                    </a>
                </div>
            </Card>

            {placeholders > 0 && (
                <Card className="flex flex-wrap items-center justify-between gap-4 xl:col-span-2">
                    <div className="text-sm leading-relaxed">
                        <p className="font-semibold">{fmt(placeholders)} sample items still listed</p>
                        They came with the preview build. Once your own list is uploaded, remove them here. Any sample you edited or re-uploaded is kept.
                    </div>
                    <ConfirmButton
                        className="text-destructive"
                        title={`Remove all ${fmt(placeholders)} sample items?`}
                        description="Items you uploaded or edited stay."
                        confirm="Remove samples"
                        onConfirm={() => router.delete('/admin/items/placeholders')}
                    >
                        Remove sample items
                    </ConfirmButton>
                </Card>
            )}
        </div>
    );
}
