"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { arrayMove } from "@dnd-kit/sortable";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { TrendingUp } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Outline } from "@/components/data-table";

const SECTION_TYPES = [
    "Table of Contents",
    "Executive Summary",
    "Technical Approach",
    "Design",
    "Capabilities",
    "Focus Document",
    "Narrative",
];

const STATUSES = ["Pending", "In-Progress", "Completed"];

const REVIEWERS = ["Assim", "Bini", "Mami"];

const chartData = [
    { month: "January", desktop: 186, mobile: 80 },
    { month: "February", desktop: 305, mobile: 200 },
    { month: "March", desktop: 237, mobile: 120 },
    { month: "April", desktop: 73, mobile: 190 },
    { month: "May", desktop: 209, mobile: 130 },
    { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "hsl(var(--chart-1))",
    },
    mobile: {
        label: "Mobile",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

export default function OutlinePage() {
    const params = useParams();
    const { toast } = useToast();
    const orgId = params.orgId as string;

    const [outlines, setOutlines] = useState<Outline[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [editingOutline, setEditingOutline] = useState<Outline | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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

    const handleUpdate = async (id: string, data: Partial<Outline>) => {
        // Optimistic update
        setOutlines(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));

        // TODO: Call backend API if needed for inline edits
    };

    const handleDragEnd = (activeId: string, overId: string) => {
        setOutlines((items) => {
            const oldIndex = items.findIndex((item) => item.id === activeId);
            const newIndex = items.findIndex((item) => item.id === overId);
            const newItems = arrayMove(items, oldIndex, newIndex);

            // Persist order
            const ids = newItems.map(item => item.id);
            const sessionToken = localStorage.getItem("session_token");

            fetch(`/api/organization/${orgId}/outline/reorder`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({ ids }),
            }).catch(error => {
                console.error("Failed to save order:", error);
                toast({
                    title: "Error",
                    description: "Failed to save new order",
                    variant: "destructive",
                });
            });

            return newItems;
        });
    };

    return (
        <div className="container mx-auto py-10">
            {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                    Loading outlines...
                </div>
            ) : (
                <DataTable
                    data={outlines}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onDragEnd={handleDragEnd}
                    onAddClick={() => handleOpenSheet()}
                    onEditClick={handleOpenSheet}
                />
            )}

            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="sm:max-w-[540px] overflow-y-auto">
                    <SheetHeader className="gap-1">
                        <SheetTitle>
                            {editingOutline ? editingOutline.header : "Add New Section"}
                        </SheetTitle>
                        <SheetDescription>
                            {editingOutline
                                ? "Showing total visitors for the last 6 months"
                                : "Fill in the details for the new section"}
                        </SheetDescription>
                    </SheetHeader>

                    {editingOutline && (
                        <div className="flex flex-col gap-4 py-4">
                            <ChartContainer config={chartConfig}>
                                <AreaChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{
                                        left: 0,
                                        right: 10,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => value.slice(0, 3)}
                                        hide
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Area
                                        dataKey="mobile"
                                        type="natural"
                                        fill="var(--color-mobile)"
                                        fillOpacity={0.6}
                                        stroke="var(--color-mobile)"
                                        stackId="a"
                                    />
                                    <Area
                                        dataKey="desktop"
                                        type="natural"
                                        fill="var(--color-desktop)"
                                        fillOpacity={0.4}
                                        stroke="var(--color-desktop)"
                                        stackId="a"
                                    />
                                </AreaChart>
                            </ChartContainer>
                            <Separator />
                            <div className="grid gap-2">
                                <div className="flex gap-2 font-medium leading-none">
                                    Trending up by 5.2% this month{" "}
                                    <TrendingUp className="size-4" />
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    Showing total visitors for the last 6 months. This is just
                                    some random text to test the layout. It spans multiple lines
                                    and should wrap around.
                                </div>
                            </div>
                            <Separator />
                        </div>
                    )}

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

                        <div className="grid grid-cols-2 gap-4">
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
                                        <SelectValue placeholder="Select type" />
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
