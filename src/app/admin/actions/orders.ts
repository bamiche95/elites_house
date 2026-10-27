"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-helpers";
import { formBool, formOptional, formString } from "@/lib/form";
import { expireStaleOrders, updateOrderStatus } from "@/lib/orders";
import { adminOrderStatusSchema } from "@/lib/validators";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();

  const orderId = formString(formData, "orderId");
  if (!orderId) fail("/admin/orders", "Missing order reference.");

  const parsed = adminOrderStatusSchema.safeParse({
    status: formString(formData, "status"),
    trackingNumber: formOptional(formData, "trackingNumber"),
    trackingCarrier: formOptional(formData, "trackingCarrier"),
    note: formOptional(formData, "note"),
    notifyCustomer: formBool(formData, "notifyCustomer"),
  });

  if (!parsed.success) {
    fail(
      `/admin/orders/${orderId}`,
      parsed.error.issues[0]?.message ?? "Choose a valid status.",
    );
  }

  try {
    await updateOrderStatus({
      orderId,
      status: parsed.data.status,
      trackingNumber: parsed.data.trackingNumber,
      trackingCarrier: parsed.data.trackingCarrier,
      note: parsed.data.note,
      notify: parsed.data.notifyCustomer,
    });
  } catch (error) {
    fail(
      `/admin/orders/${orderId}`,
      error instanceof Error ? error.message : "We couldn't update that order.",
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${formString(formData, "orderNumber")}`);

  redirect(`/admin/orders/${orderId}?saved=1`);
}

export async function expireOrdersAction() {
  await requireAdmin();
  const released = await expireStaleOrders(2, 100);
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  redirect(`/admin/orders?expired=${released}`);
}
