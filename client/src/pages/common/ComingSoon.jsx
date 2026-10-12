import { useNavigate } from "react-router-dom";

function ComingSoon({
  title = "Coming soon",
  message = "This page is being built and will be available soon.",
}) {
  const navigate = useNavigate();

  const goBack = () => {
    let role = null;

    try {
      role = JSON.parse(localStorage.getItem("workhubUser"))?.role;
    } catch {
      role = null;
    }

    if (role === "DIRECTOR") {
      navigate("/director");
    } else if (role === "TL") {
      navigate("/tl");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          ViaVistas WorkHub
        </p>

        <h1 className="mt-3 text-2xl font-extrabold text-[#111111]">
          {title}
        </h1>

        <p className="mt-3 text-sm text-neutral-500">{message}</p>

        <button
          onClick={goBack}
          className="mt-6 rounded-xl bg-[#111111] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#242424]"
        >
          Back to dashboard
        </button>
      </div>
    </div>
  );
}

export default ComingSoon;