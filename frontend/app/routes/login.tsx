import { Pet } from "~/features/pet";

export default function Login() {
  return (
    <section className="screen notab" style={{ justifyContent: "center" }}>
      <Pet accessories={["cap"]} size={170} bob />
      <h2 className="title" style={{ textAlign: "center", fontSize: 28 }}>お買い物上手</h2>
    </section>
  );
}
