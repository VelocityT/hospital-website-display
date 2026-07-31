import PrintHeader from "../PrintHeader";

/**
 * The generic Velocare letterhead — what every hospital gets unless a bespoke
 * template is assigned. This is exactly the markup Print.jsx used before
 * templates existed, so behaviour for existing hospitals is unchanged.
 */
const DefaultPage = ({ children }) => (
  <div className="p-4 print:p-0 bg-white print:bg-white">
    <PrintHeader />
    {children}
  </div>
);

export default DefaultPage;
