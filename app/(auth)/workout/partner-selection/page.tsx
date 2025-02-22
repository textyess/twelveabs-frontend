import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

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

export default function PartnerSelectionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl max-w-6xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
        Who do you want to train with today?
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {trainers.map((trainer) => (
          <Link key={trainer.name} href={trainer.href}>
            <Card className="group border-blue-400 hover:border-blue-600 transition-all duration-300 overflow-hidden">
              <div className="relative h-[30rem] w-full bg-gray-800">
                <Image
                  src={trainer.image}
                  alt={trainer.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl font-bold text-white text-center">
                    {trainer.name}
                  </h2>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
