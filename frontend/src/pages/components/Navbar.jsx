import { useState } from "react";
import { Layout, Avatar, Dropdown, Menu, Modal, Button, Tooltip } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { logoutUserApi } from "../../services/apis";
import { removeUser } from "../../redux/userSlice";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import { MdOutlineLightMode } from "react-icons/md";
import { IoMoonOutline } from "react-icons/io5";
import { removeHospital } from "../../redux/hospitalSlice";
import { formatDateTime } from "../../utils/helper";
import toast from "react-hot-toast";

const { Header } = Layout;

const Navbar = () => {
  const user = useSelector((state) => state.user);
  const hospital = useSelector((state) => state.hospital);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  const handleMenuClick = async ({ key }) => {
    if (key === "profile") {
      setProfileModalVisible(true);
    } else if (key === "logout") {
      const response = await logoutUserApi();
      toast.success(response.message);
      dispatch(removeUser());
      dispatch(removeHospital());
      window.setTheme?.("light");
      navigate("/login");
    } else if (key === "toggle-theme") {
      const newTheme = window.theme === "dark" ? "light" : "dark";
      window.setTheme?.(newTheme);
      setTheme(newTheme);
    }
  };

  const userMenu = [
    {
      key: "profile",
      label: "Profile",
      icon: <FaUserCircle />,
    },
    {
      key: "logout",
      label: "Sign Out",
      icon: <FaSignOutAlt className="text-red-500" />,
    },
  ];

  return (
    <>
      <Header className="bg-white dark:bg-inherit px-4 flex justify-between items-center shadow-sm">
        {user?.role === "superAdmin" ? (
          <div className="text-sm font-semibold">SUPER ADMIN</div>
        ) : (
          <div className="text-sm font-semibold">{user.role.toUpperCase()}</div>
        )}

        {user && (
          <div className="flex items-center space-x-4">
            <Tooltip
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              <button
                onClick={() => handleMenuClick({ key: "toggle-theme" })}
                className="text-xl hover:text-yellow-500 transition-colors duration-200"
              >
                {theme === "dark" ? <MdOutlineLightMode /> : <IoMoonOutline />}
              </button>
            </Tooltip>

            <Dropdown
              menu={{ items: userMenu, onClick: handleMenuClick }}
              trigger={["click"]}
            >
              <div className="cursor-pointer flex items-center space-x-2">
                <Avatar icon={<UserOutlined />} />
                <span className="font-medium hidden md:inline">
                  {user.fullName}
                </span>
              </div>
            </Dropdown>
          </div>
        )}
      </Header>

      <Modal
        title={
          <p className="font-semibold text-xl text-green-700">
            {hospital?.fullName.toUpperCase()}
          </p>
        }
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setProfileModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {user && (
          <div>
            <p>
              <b>Name:</b>
              <span
                onClick={() => {
                  setProfileModalVisible(false);
                  navigate("/profile");
                }}
                className="cursor-pointer text-blue-600 hover:underline"
              >
                {" "}
                {user.fullName}
              </span>
            </p>
            <p>
              <b>Role:</b> {user.role}
            </p>
            <p>
              <b>Email:</b> {user.email}
            </p>
            <p>
              <b>Phone:</b> {user.phone}
            </p>
            {user.role === "doctor" && (
              <>
                <p>
                  <b>IPD Charges:</b> {user.ipdCharge}{" "}
                  <span className="text-green-600 font-semibold">
                    ({user?.ipdCommission}%)
                  </span>
                </p>
                <p>
                  <b>OPD Charges:</b> {user.opdCharge}{" "}
                  <span className="text-green-600 font-semibold">
                    ({user?.opdCommission}%)
                  </span>
                </p>
              </>
            )}
            <p>
              <b>Last Login:</b> {formatDateTime(user.lastLogin)}
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};
export default Navbar;
