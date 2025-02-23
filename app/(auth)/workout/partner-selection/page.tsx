"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface TrainerCard {
  name: string;
  image: string;
  href: string;
}

const trainers: TrainerCard[] = [
  {
    name: "Arnold",
    image: "/trainers/arnold.png",
    href: "/workout/new?trainer=arnold",
  },
  {
    name: "John Cena",
    image: "/trainers/cena.png",
    href: "/workout/new?trainer=cena",
  },
  {
    name: "Serena Williams",
    image: "/trainers/serena.png",
    href: "/workout/new?trainer=serena",
  },
  {
    name: "The Rock",
    image: "/trainers/the-rock.png",
    href: "/workout/new?trainer=the-rock",
  },
  {
    name: "Mariusz Pudzianowski",
    image: "/trainers/mariusz.png",
    href: "/workout/new?trainer=mariusz",
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
        {trainers.map((trainer, index) => (
          <motion.div
            key={trainer.name}
            variants={cardVariants}
            whileHover={{
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href={trainer.href}>
              <Card className="group border-blue-400 hover:border-blue-600 transition-all duration-300 overflow-hidden">
                <div className="relative h-[30rem] w-full bg-gray-800">
                  <Image
                    src={trainer.image}
                    alt={trainer.name}
                    fill
                    className="object-cover transition-transform duration-300"
                  />
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
                    whileHover={{ opacity: 0.9 }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 p-6"
                    whileHover={{ y: -5 }}
                  >
                    <h2 className="text-2xl font-bold text-white text-center">
                      {trainer.name}
                    </h2>
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
