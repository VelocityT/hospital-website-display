import { Link } from "react-router-dom";
import { LuGhost } from "react-icons/lu";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center">
      <div className="bg-blue-100 dark:bg-blue-900/40 p-6 rounded-full mb-4 shadow-md animate-float">
        <LuGhost className="text-6xl text-blue-500 dark:text-blue-300" />
      </div>
      <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-2">
        Oops! Page not found
      </h1>
      <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mb-6">
        The page you're looking for doesn’t exist or has been moved. If you
        believe this is an error, please contact the system administrator.
      </p>
      <Link
        to="/dashboard"
        className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition shadow"
      >
        Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFoundPage;
