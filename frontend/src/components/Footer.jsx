import React from "react";
import { Link } from "react-router-dom";
import {
  FiInstagram,
  FiYoutube,
  FiTwitter,
  FiFacebook,
  FiArrowUp,
  FiMail,
  FiMapPin,
} from "react-icons/fi";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="bg-[#0B1F33] text-white">

      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D6A84F] text-[#0B1F33]">
                <span className="text-lg font-bold">V</span>
              </div>

              <span className="text-xl font-bold tracking-tight">
                Vlogify
              </span>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-gray-400">
              Discover inspiring stories, explore amazing places, and share
              your journey with a growing community of creators.
            </p>

            {/* Social Icons */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-[#D6A84F] hover:bg-[#D6A84F] hover:text-[#0B1F33]"
              >
                <FiInstagram size={17} />
              </a>

              <a
                href="#"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-[#D6A84F] hover:bg-[#D6A84F] hover:text-[#0B1F33]"
              >
                <FiYoutube size={17} />
              </a>

              <a
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-[#D6A84F] hover:bg-[#D6A84F] hover:text-[#0B1F33]"
              >
                <FiTwitter size={17} />
              </a>

              <a
                href="#"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-[#D6A84F] hover:bg-[#D6A84F] hover:text-[#0B1F33]"
              >
                <FiFacebook size={17} />
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D6A84F]">
              Explore
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to="/vlogs"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Explore Vlogs
                </Link>
              </li>

              <li>
                <Link
                  to="/trending"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Trending
                </Link>
              </li>

              <li>
                <Link
                  to="/categories"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Creator */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D6A84F]">
              Creator
            </h3>

            <ul className="mt-5 space-y-3">
              <li>
                <Link
                  to="/register"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Become a Creator
                </Link>
              </li>

              <li>
                <Link
                  to="/create-vlog"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Create Vlog
                </Link>
              </li>

              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  Creator Dashboard
                </Link>
              </li>

              <li>
                <Link
                  to="/profile"
                  className="text-sm text-gray-400 transition hover:text-white"
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D6A84F]">
              Get in touch
            </h3>

            <div className="mt-5 space-y-4">

              <div className="flex items-start gap-3">
                <FiMail
                  className="mt-0.5 shrink-0 text-[#D6A84F]"
                  size={17}
                />

                <div>
                  <p className="text-xs text-gray-500">
                    Email
                  </p>

                  <a
                    href="mailto:hello@vlogify.com"
                    className="mt-1 block text-sm text-gray-400 transition hover:text-white"
                  >
                    hello@vlogify.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FiMapPin
                  className="mt-0.5 shrink-0 text-[#D6A84F]"
                  size={17}
                />

                <div>
                  <p className="text-xs text-gray-500">
                    Community
                  </p>

                  <p className="mt-1 text-sm text-gray-400">
                    Creators around the world
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h3 className="text-lg font-semibold">
                Stay inspired
              </h3>

              <p className="mt-1 text-sm text-gray-400">
                Get the latest stories and creator inspiration in your inbox.
              </p>
            </div>

            <div className="flex w-full max-w-md rounded-lg bg-white p-1.5">
              <input
                type="email"
                placeholder="Enter your email"
                className="min-w-0 flex-1 bg-transparent px-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />

              <button className="rounded-md bg-[#D6A84F] px-4 py-2.5 text-sm font-semibold text-[#0B1F33] transition hover:bg-[#E3B963]">
                Subscribe
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">

          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Vlogify. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-5">
            <Link
              to="/privacy"
              className="text-xs text-gray-500 transition hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              className="text-xs text-gray-500 transition hover:text-white"
            >
              Terms of Service
            </Link>

            <Link
              to="/contact"
              className="text-xs text-gray-500 transition hover:text-white"
            >
              Contact
            </Link>

            {/* Back to Top */}
            <button
              onClick={scrollToTop}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-gray-400 transition hover:border-[#D6A84F] hover:bg-[#D6A84F] hover:text-[#0B1F33]"
              aria-label="Back to top"
              title="Back to top"
            >
              <FiArrowUp size={15} />
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;