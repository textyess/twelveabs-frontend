"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface TrainerCard {
  name: string;
  image: string;
  href: string;
  available: boolean;
}

const trainers: TrainerCard[] = [
  {
    name: "Arnold Schwarzenegger",
    image: "/trainers/arnold.png",
    href: "/workout/new?trainer=arnold",
    available: true,
  },
  {
    name: "Goku",
    image: "/trainers/goku.png",
    href: "/coming-soon",
    available: false,
  },
  {
    name: "Serena Williams",
    image: "/trainers/serena.png",
    href: "/coming-soon",
    available: false,
  },
  {
    name: "The Rock",
    image: "/trainers/the-rock.png",
    href: "/coming-soon",
    available: false,
  },
  {
    name: "Mariusz Pudzianowski",
    image: "/trainers/mariusz.png",
    href: "/coming-soon",
    available: false,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function PartnerSelectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        className="text-4xl max-w-6xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        Who do you want to train with today?
      </motion.h1>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {trainers.map((trainer) => (
          <motion.div
            key={trainer.name}
            variants={cardVariants}
            whileHover={
              trainer.available
                ? {
                    scale: 1.02,
                    transition: { duration: 0.2 },
                  }
                : {}
            }
            whileTap={trainer.available ? { scale: 0.98 } : {}}
            className={!trainer.available ? "opacity-75" : ""}
          >
            <Link href={trainer.href}>
              <Card
                className={`group overflow-hidden ${
                  trainer.available
                    ? "border-blue-400 hover:border-blue-600"
                    : "border-gray-700"
                } transition-all duration-300`}
              >
                <div className="relative h-[30rem] w-full bg-gray-800">
                  <Image
                    src={trainer.image}
                    alt={trainer.name}
                    fill
                    className={`object-cover transition-transform duration-300 ${
                      !trainer.available ? "grayscale" : ""
                    }`}
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                    whileHover={trainer.available ? { opacity: 0.9 } : {}}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 p-6"
                    whileHover={trainer.available ? { y: -5 } : {}}
                  >
                    <h2 className="text-2xl font-bold text-white text-center mb-2">
                      {trainer.name}
                    </h2>
                    {!trainer.available && (
                      <Badge
                        variant="secondary"
                        className="mx-auto block w-fit bg-gray-800/80 text-gray-300"
                      >
                        Coming Soon
                      </Badge>
                    )}
                  </motion.div>
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
