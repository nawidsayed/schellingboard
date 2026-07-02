import { initMailer } from "@/utils/mailer";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    initMailer();
  }
}
