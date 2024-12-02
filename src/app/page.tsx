import { Button } from "@/components/ui/button";
import { GoogleOneTap, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
	return (
		<div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
			<main className="flex flex-col gap-4 row-start-2 items-center w-full max-w-xl">
				<h1 className="text-5xl font-bold text-center ">
					Your shopping list for everything
				</h1>
				<p className="text-lg text-center">
					A simple app to help you keep track of everything you need to buy.
				</p>
				<div>
					<GoogleOneTap />
					<SignedIn>
						<Link href="/app">
							<Button>Dashboard</Button>
						</Link>
					</SignedIn>
					<SignedOut>
						<SignInButton>
							<Button>Sign in</Button>
						</SignInButton>
					</SignedOut>
				</div>
			</main>
		</div>
	);
}
