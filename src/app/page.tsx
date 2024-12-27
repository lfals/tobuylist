import { Button } from "@/components/ui/button";
import { GoogleOneTap, SignInButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
	const { userId } = await auth()

	if (userId) {
		redirect("/app")
	}

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
					<SignInButton mode="modal" >
						<Button>Sign in</Button>
					</SignInButton>
				</div>
			</main>
		</div>
	);
}
