// Preview for `pnpm email:dev` only, with sample props.
import { RegistrationConfirmed } from "../templates";

export default function Preview() {
  return (
    <RegistrationConfirmed
      teamName="Wave Riders"
      code="SL27-7KQ4-M9XD"
      category="university"
      siteUrl="https://sliot.cse.mrt.ac.lk"
    />
  );
}
