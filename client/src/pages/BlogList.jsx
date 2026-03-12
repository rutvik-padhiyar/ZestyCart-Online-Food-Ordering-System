import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    axios.get("/api/blogs").then(({ data }) => setBlogs(data.blogs || [])).catch(() => {});
  }, []);

  return (
    <div className="public-shell">
      <div className="public-section pt-24">
        <section className="public-hero rounded-[36px] px-8 py-10 text-white">
          <div className="public-pill">Editorial feed</div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight lg:text-5xl">Stories, food ideas and platform updates in a richer reading experience.</h1>
        </section>

        <section className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {blogs.map((blog) => (
            <Link key={blog._id} to={`/blogs/${blog.slug}`} className="public-card overflow-hidden rounded-[32px] transition hover:-translate-y-1">
              <img src={blog.image} alt={blog.title} className="h-56 w-full object-cover" />
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-slate-950 line-clamp-2">{blog.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600 line-clamp-3">{blog.excerpt}</p>
                <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
                  <span>{blog.author}</span>
                  <span>{new Date(blog.publishedAt).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}
