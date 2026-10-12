import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in.");
      }

      localStorage.setItem("workhubToken", data.token);

      localStorage.setItem("workhubUser", JSON.stringify(data.user));

      if (data.user.role === "DIRECTOR") {
        navigate("/director");
      } else if (data.user.role === "TL") {
        navigate("/tl");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);

      setError(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="min-h-screen bg-[#111111] p-4 md:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] bg-[#f7f7f5] md:min-h-[calc(100vh-3rem)] md:grid-cols-2">
        {/* Brand Side */}
        <section className="relative hidden overflow-hidden bg-[#111111] p-10 text-white md:flex md:flex-col md:justify-between lg:p-14">
          <div>
            <img
              src="/viavistas-logo.png"
              alt="ViaVistas WorkHub"
              className="h-34 w-auto object-contain"
            />
          </div>

          <div className="max-w-lg">
            <p className="mb-5 text-sm font-medium uppercase tracking-[0.25em] text-white/50">
              Internal Workspace
            </p>

            <h1 className="font-['Manrope'] text-5xl font-extrabold leading-[1.05] lg:text-6xl">
              Work smarter.
              <br />
              Get noticed.
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-white/60">
              Manage your work, track your performance, collaborate with your
              team and make your contribution count.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40">
            <span>VIAVISTAS WORKHUB</span>
            <span>© 2026</span>
          </div>
        </section>

        {/* Login Side */}
        <section className="flex items-center justify-center p-6 md:p-10 lg:p-16">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="mb-10 md:hidden">
              <img
                src="/viavistas-logo.png"
                alt="ViaVistas WorkHub"
                className="h-20 w-auto object-contain"
              />
            </div>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-400">
                Welcome back
              </p>

              <h2 className="font-['Manrope'] text-3xl font-extrabold tracking-tight text-[#111111] md:text-4xl">
                Sign in to WorkHub
              </h2>

              <p className="mt-3 text-sm leading-6 text-neutral-500">
                Access your tasks, performance and team workspace.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-[#111111]"
                >
                  Work email
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />

                  <input
                    id="email"
                    type="email"
                    placeholder="name@viavistas.co.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-13 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#111111] focus:ring-2 focus:ring-black/5"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-[#111111]"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-semibold text-neutral-500 transition hover:text-[#111111]"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  />

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-13 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#111111] focus:ring-2 focus:ring-black/5"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 text-sm font-bold text-white transition hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}

                {!loading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-1"
                  />
                )}
              </button>
            </form>

            <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-4">
              <p className="text-xs leading-5 text-neutral-500">
                This platform is exclusively for authorized ViaVistas team
                members. Please use your official work credentials.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
