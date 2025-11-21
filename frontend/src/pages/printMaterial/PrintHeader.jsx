import { useSelector } from "react-redux";

const PrintHeader = () => {
  const hospital = useSelector((state) => state.hospital);
  return (
    <div className="flex justify-between items-start border-b pb-4 mb-6">
      <div className="flex gap-4 items-center">
        {hospital?.logo && (
          <img
            src={hospital.logo}
            alt="Hospital Logo"
            className="w-16 h-16 object-contain rounded"
          />
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">
            {hospital.fullName}
          </h1>
          <p className="text-sm text-gray-700">{hospital.tagline}</p>
        </div>
      </div>

      <div className="text-right text-sm text-gray-700 leading-tight">
        <div>{hospital.address}</div>
        <div>
          <b>Phone:</b> {hospital.phone}
        </div>
        <div>
          <b>Email:</b> {hospital.email}
        </div>
        <div>
          <b>Website:</b>{" "}
          <a
            href={hospital.website}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            {hospital.website}
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrintHeader;
