"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { type WorkoutSession } from "@/lib/types/database";

export const WorkoutSessionsColumns: ColumnDef<WorkoutSession>[] = [
  {
    accessorKey: "session_type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="text-gray-100 hover:text-gray-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Session Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const type = row.getValue("session_type") as string;
      return <div className="text-gray-300 capitalize">{type}</div>;
    },
  },
  {
    accessorKey: "started_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="text-gray-100 hover:text-gray-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Started
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("started_at"));
      return (
        <div className="text-gray-300">
          {formatDistanceToNow(date, { addSuffix: true })}
        </div>
      );
    },
  },
  {
    accessorKey: "duration_minutes",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="text-gray-100 hover:text-gray-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Duration
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const minutes = row.getValue("duration_minutes");
      return (
        <div className="text-gray-300">{minutes ? `${minutes} min` : "-"}</div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="text-gray-100 hover:text-gray-300"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
          ${
            status === "completed"
              ? "bg-green-100 text-green-800"
              : status === "in_progress"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status.replace("_", " ")}
        </div>
      );
    },
  },
];
