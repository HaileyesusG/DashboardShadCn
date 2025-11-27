"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MoreHorizontal, Plus, Pencil, Trash2, Settings2, Clock, Loader, CheckCircle2 } from "lucide-react";

interface Outline {
    id: string;
    header: string;
    sectionType: string;
    status: string;
    target: number;
    limit: number;
    reviewer: string;
}

const SECTION_TYPES = [
    "Table of Contents",
    "Executive Summary",
    "Introduction",
    "Methodology",
    "Results",
    "Discussion",
    "Conclusion",
    "References",
];

const STATUSES = ["Pending", "In-Progress", "Completed"];

const REVIEWERS = ["Assim", "Bini", "Mami"];

// Status icon component
const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case "Completed":
            return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        case "In-Progress":
            return <Loader className="h-4 w-4 text-blue-600" />;
        case "Pending":
            return <Clock className="h-4 w-4 text-gray-600" />;
        default:
            return null;
    }
};

export default function OutlinePage() {
    const params = useParams();
    const { toast } = useToast();
    const orgId = params.orgId as string;

    const [outlines, setOutlines] = useState<Outline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingOutline, setEditingOutline] = useState<Outline | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState({
        header: true,
        sectionType: true,
        status: true,
        target: true,
        limit: true,
        reviewer: true,
    });

    const [formData, setFormData] = useState({
        header: "",
        sectionType: "",
        status: "",
        target: "",
        limit: "",
        reviewer: "",
    });

    useEffect(() => {
        fetchOutlines();
    }, [orgId]);

    const fetchOutlines = async () => {
        try {
            const sessionToken = localStorage.getItem("session_token");
            const response = await fetch(`/api/organization/${orgId}/outline`, {
                headers: {
                    "Authorization": `Bearer ${sessionToken}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch outlines");

            const data = await response.json();
            setOutlines(data.outlines);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to load outlines",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenSheet = (outline?: Outline) => {
        if (outline) {
            setEditingOutline(outline);
            setFormData({
                header: outline.header,
                sectionType: outline.sectionType,
                status: outline.status,
                target: outline.target.toString(),
                limit: outline.limit.toString(),
                reviewer: outline.reviewer,
            });
        } else {
            setEditingOutline(null);
            setFormData({
                header: "",
                sectionType: "",
                status: "",
                target: "",
                limit: "",
                reviewer: "",
            });
        }
        setSheetOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingOutline
                ? `/api/organization/${orgId}/outline/${editingOutline.id}`
                : `/api/organization/${orgId}/outline`;

            const method = editingOutline ? "PATCH" : "POST";

            const sessionToken = localStorage.getItem("session_token");
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionToken}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to save outline");
            }

            toast({
                title: editingOutline ? "Outline updated" : "Outline created",
                description: "Your changes have been saved successfully",
            });

            setSheetOpen(false);
            fetchOutlines();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this outline?")) return;

        try {
            const sessionToken = localStorage.getItem("session_token");
            const response = await fetch(`/api/organization/${orgId}/outline/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${sessionToken}`,
                },
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to delete outline");
            }

            toast({
                title: "Outline deleted",
                description: "The outline has been deleted successfully",
            });

            fetchOutlines();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">Outline</CardTitle>
                        <div className="flex gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Settings2 className="mr-2 h-4 w-4" />
                                        Customize Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.header}
                                        onCheckedChange={(checked) =>
                                            setVisibleColumns({ ...visibleColumns, header: checked })
                                        }
                                    >
                                        Header
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.sectionType}
                                        onCheckedChange={(checked) =>
                                            setVisibleColumns({ ...visibleColumns, sectionType: checked })
                                        }
                                    >
                                        Section Type
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.status}
                                        onCheckedChange={(checked) =>
                                            setVisibleColumns({ ...visibleColumns, status: checked })
                                        }
                                    >
                                        Status
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.target}
                                        onCheckedChange={(checked) =>
                                            setVisibleColumns({ ...visibleColumns, target: checked })
                                        }
                                    >
                                        Target
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.limit}
                                        onCheckedChange={(checked) =>
                                            setVisibleColumns({ ...visibleColumns, limit: checked })
                                        }
                                    >
                                        Limit
                                    </DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem
                                        checked={visibleColumns.reviewer}
                                        onCheckedChange={(checked) =>
                                            setVisibleColumns({ ...visibleColumns, reviewer: checked })
                                        }
                                    >
                                        Reviewer
                                    </DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Button onClick={() => handleOpenSheet()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Section
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Loading outlines...
                        </div>
                    ) : outlines.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No outlines yet. Click "Add Section" to create one.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {visibleColumns.header && <TableHead>Header</TableHead>}
                                    {visibleColumns.sectionType && <TableHead>Section Type</TableHead>}
                                    {visibleColumns.status && <TableHead>Status</TableHead>}
                                    {visibleColumns.target && <TableHead>Target</TableHead>}
                                    {visibleColumns.limit && <TableHead>Limit</TableHead>}
                                    {visibleColumns.reviewer && <TableHead>Reviewer</TableHead>}
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {outlines.map((outline) => (
                                    <TableRow
                                        key={outline.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleOpenSheet(outline)}
                                    >
                                        {visibleColumns.header && (
                                            <TableCell className="font-medium">{outline.header}</TableCell>
                                        )}
                                        {visibleColumns.sectionType && (
                                            <TableCell>{outline.sectionType}</TableCell>
                                        )}
                                        {visibleColumns.status && (
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon status={outline.status} />
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${outline.status === "Completed"
                                                                ? "bg-green-100 text-green-800"
                                                                : outline.status === "In-Progress"
                                                                    ? "bg-blue-100 text-blue-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            }`}
                                                    >
                                                        {outline.status}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        )}
                                        {visibleColumns.target && <TableCell>{outline.target}</TableCell>}
                                        {visibleColumns.limit && <TableCell>{outline.limit}</TableCell>}
                                        {visibleColumns.reviewer && <TableCell>{outline.reviewer}</TableCell>}
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleOpenSheet(outline)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(outline.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>
                            {editingOutline ? "Edit Section" : "Add New Section"}
                        </SheetTitle>
                        <SheetDescription>
                            {editingOutline
                                ? "Update the section details below"
                                : "Fill in the details for the new section"}
                        </SheetDescription>
                    </SheetHeader>
                    <form onSubmit={handleSave} className="space-y-6 py-6">
                        <div className="space-y-2">
                            <Label htmlFor="header">Header</Label>
                            <Input
                                id="header"
                                value={formData.header}
                                onChange={(e) => setFormData({ ...formData, header: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="sectionType">Section Type</Label>
                            <Select
                                value={formData.sectionType}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, sectionType: value })
                                }
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select section type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SECTION_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="target">Target</Label>
                            <Input
                                id="target"
                                type="number"
                                value={formData.target}
                                onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="limit">Limit</Label>
                            <Input
                                id="limit"
                                type="number"
                                value={formData.limit}
                                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reviewer">Reviewer</Label>
                            <Select
                                value={formData.reviewer}
                                onValueChange={(value) => setFormData({ ...formData, reviewer: value })}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select reviewer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REVIEWERS.map((reviewer) => (
                                        <SelectItem key={reviewer} value={reviewer}>
                                            {reviewer}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <SheetFooter>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? "Saving..." : editingOutline ? "Update" : "Create"}
                            </Button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
