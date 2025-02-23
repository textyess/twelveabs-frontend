"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ComingSoonPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Link href="/workout/partner-selection">
        <Button variant="ghost" className="mb-8 text-white">
          <ArrowLeft className="mr-2 h-4 w-4  hover:text-blue-400" />
          Back to Trainers
        </Button>
      </Link>

      <motion.div
        className="max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          Coming Soon!
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          This trainer is not available yet. We&apos;re working hard to bring
          more legendary fitness icons to TwelveAbs. In the meantime, why not
          train with Arnold Schwarzenegger?
        </p>
        <Link href="/workout/new?trainer=arnold">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Train with Arnold
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
