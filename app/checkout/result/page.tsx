import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { IyzicoCallbackCard } from "./iyzico-callback-card";

export const dynamic = "force-dynamic";

export default async function IyzicoCallbackPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("paymentId")?.value;
  if (!token) {
    redirect("/checkout");
  }
  return <IyzicoCallbackCard token={token} />;
}
