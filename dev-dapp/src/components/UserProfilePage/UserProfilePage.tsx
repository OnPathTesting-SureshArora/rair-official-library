//@ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  faGreaterThan,
  faHeart,
  faHouse,
  faPlus,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { Popup } from "reactjs-popup";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Stack } from "@mui/material";
import { Breadcrumbs, Typography } from "@mui/material";
import axios from "axios";
import { isAddress, ZeroAddress } from "ethers";
import { Hex } from "viem";

import { TUserResponse } from "../../axios.responseTypes";
import { useAppDispatch, useAppSelector } from "../../hooks/useReduxHooks";
import useSwal from "../../hooks/useSwal";
import useWindowDimensions from "../../hooks/useWindowDimensions";
import { VideoIcon } from "../../images";
import { CatalogVideoItem, NftItemToken } from "../../types/commonTypes";
import { User } from "../../types/databaseTypes";
import { rFetch } from "../../utils/rFetch";
import InputField from "../common/InputField";
import LoadingComponent from "../common/LoadingComponent";
import { TooltipBox } from "../common/Tooltip/TooltipBox";
import FilteringBlock from "../MockUpPage/FilteringBlock/FilteringBlock";
import { ImageLazy } from "../MockUpPage/ImageLazy/ImageLazy";
import CustomShareButton from "../MockUpPage/NftList/NftData/CustomShareButton";
import SharePopUp from "../MockUpPage/NftList/NftData/TitleCollection/SharePopUp/SharePopUp";
import { PersonalProfileMyNftTab } from "../nft/PersonalProfile/PersonalProfileMyNftTab/PersonalProfileMyNftTab";
import { PersonalProfileMyVideoTab } from "../nft/PersonalProfile/PersonalProfileMyVideoTab/PersonalProfileMyVideoTab";
import { TSortChoice } from "../ResalePage/listOffers.types";
import { SvgUserIcon } from "../UserProfileSettings/SettingsIcons/SettingsIcons";

import { PersonalProfileIcon } from "./../nft/PersonalProfile/PersonalProfileIcon/PersonalProfileIcon";
import UserProfileCreated from "./UserProfileCreated/UserProfileCreated";
import UserProfileFavoritesTab from "./UserProfileFavorites/UserProfileFavoritesTab";

import "./UserProfilePage.css";
import LeaderBoard from "../DevSdkPage/LeaderBoard/LeaderBoard";
import EarnRewards from "../DevSdkPage/EarnRewards/EarnRewards";
import { loadVideoList } from "../../redux/videoSlice";

const UserProfilePage: React.FC = () => {
  const { primaryColor, textColor, headerLogo, iconColor, primaryButtonColor } =
    useAppSelector((store) => store.colors);
  const { userAddress } = useParams();
  const dispatch = useAppDispatch();
  const { videos, videoListStatus } = useAppSelector((store) => store.videos);
  const { currentUserAddress } = useAppSelector((store) => store.web3);
  const [copyState, setCopyState] = useState(false);
  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [collectedTokens, setCollectedTokens] = useState<
    NftItemToken[] | undefined
  >(undefined);
  const [createdContracts, setCreatedContracts] = useState([]);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [loadingBg, setLoadingBg] = useState(false);
  const [sortItem, setSortItem] = useState<TSortChoice>();
  const [titleSearch, setTitleSearch] = useState("");
  const [tabIndexItems, setTabIndexItems] = useState(0);
  const showTokensRef = useRef<number>(20);
  const [selectedValue, setSelectedValue] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const [editMode, setEditMode] = useState(false);
  const [totalCount, setTotalCount] = useState<number>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [onResale, setOnResale] = useState<boolean>(false);
  const [isResaleLoading, setIsResaleLoding] = useState<boolean | undefined>(
    undefined
  );
  const [allRewards, setAllRewards] = useState(false);

  const [metadataFilter, setMetadataFilter] = useState<boolean>(false);

  const rSwal = useSwal();
  const { width } = useWindowDimensions();

  const titleColumnRef = [
    {
      id: 1,
      name: "Who",
      hideMobile: false,
    },
    {
      id: 2,
      name: "Where",
      hideMobile: false,
    },
    {
      id: 3,
      name: "Relationship",
      hideMobile: true,
      class: "availability-leader",
    },
    {
      id: 4,
      name: "URL",
      hideMobile: true,
      class: "language-leader",
    },
  ];

  const titleColumnExp = [
    {
      id: 1,
      name: "Project",
      hideMobile: false,
    },
    {
      id: 2,
      name: "Start",
      hideMobile: false,
    },
    {
      id: 3,
      name: "End",
      hideMobile: true,
      class: "availability-leader",
    },
    {
      id: 4,
      name: "Result",
      hideMobile: true,
      class: "language-leader",
    },
  ];

  const handleClose = (value: number) => {
    setOpen(false);
    setSelectedValue(value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const getMyNft = useCallback(
    async (number, page) => {
      if (userAddress && isAddress(userAddress)) {
        setIsLoading(true);

        const response = await rFetch(
          `/api/nft/${userAddress}?itemsPerPage=${number}&pageNum=${page}&onResale=${onResale}`
        );
        if (response.success) {
          setTotalCount(response.totalCount);
          setCollectedTokens(response.result.filter((token) => token.isMinted));
          setIsLoading(false);
          setIsResaleLoding(false);
        }

        if (response.error && response.message) {
          setIsLoading(false);
          setIsResaleLoding(false);
          return;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userAddress, onResale, setIsResaleLoding]
  );

  const handleNewUserStatus = useCallback(async () => {
    const requestContract = await rFetch("/api/contracts/full?itemsPerPage=5");
    const { success, contracts } = await rFetch(
      `/api/contracts/full?itemsPerPage=${requestContract.totalNumber || "5"}`
    );

    if (success) {
      const contractsFiltered = contracts.filter(
        (el) => el.user === userAddress
      );

      setCreatedContracts(contractsFiltered);
    }
  }, [userAddress]);

  const getUserData = useCallback(async () => {
    if (userAddress && isAddress(userAddress) && userAddress !== ZeroAddress) {
      const userAddressChanged = userAddress.toLowerCase();
      setTabIndexItems(0);
      setUserData(undefined);
      const response = await rFetch(`/api/users/${userAddressChanged}`);

      if (response.success) {
        if (response.user) {
          setUserData(response.user);
        } else {
          const defaultUser: User = {
            avatar: "",
            background: "",
            creationDate: "2023-04-25T14:54:58.190Z",
            email: "",
            firstName: "",
            lastName: "",
            nickName: `@${userAddress}`,
            ageVerified: false,
            publicAddress: userAddress as Hex,
            _id: "none",
            blocked: false,
          };
          setUserData(defaultUser);
        }
      } else {
        setUserData(undefined);
      }
    }
  }, [userAddress]);

  const editBackground = useCallback(async () => {
    if (currentUserAddress) {
      const formData = new FormData();
      if (fileUpload) {
        setLoadingBg(true);
        formData.append("files", fileUpload);
        formData.append("background", fileUpload.name);

        const profileEditResponse = await axios.patch<TUserResponse>(
          `/api/users/${currentUserAddress.toLowerCase()}`,
          formData,
          {
            headers: {
              Accept: "multipart/form-data",
            },
          }
        );

        const { user, success } = profileEditResponse.data;
        if (success && user) {
          setFileUpload(null);
          setLoadingBg(false);
          getUserData();
        }
      }
    }
  }, [currentUserAddress, fileUpload, getUserData]);

  const breadcrumbs = [
    <NavLink key="1" to="/">
      <FontAwesomeIcon
        icon={faHouse}
        style={{
          borderRadius: "5px",
          padding: "5px",
          color: textColor,
          background: primaryButtonColor,
          fontSize: "x-large",
        }}
      />
    </NavLink>,
    <Typography key="3" color={textColor}>
      {(userData && userData.nickName && userData.nickName.length > 20
        ? userData.nickName.slice(0, 5) +
          "...." +
          userData.nickName.slice(length - 4)
        : userData?.nickName) ||
        (userAddress &&
          userAddress.slice(0, 4) + "...." + userAddress.slice(length - 4))}
    </Typography>,
  ];

  const photoUpload = useCallback(
    (e) => {
      e.preventDefault();
      const reader = new FileReader();
      const fileF = e.target.files[0];
      reader.onloadend = () => {
        if (fileF.type !== "video/mp4") {
          setFileUpload(fileF);
        } else {
          rSwal.fire(
            "Info",
            `You cannot upload video to background!`,
            "warning"
          );
        }
      };
      if (fileF) {
        reader.readAsDataURL(fileF);
      }
    },
    [rSwal]
  );

  useEffect(() => {
    if (userAddress) {
      dispatch(
        loadVideoList({
          userAddress,
        })
      );
    }
  }, [dispatch, userAddress]);

  const tableData1 = [
    {
      id: 1,
      firstRow: "RAIRprotocol Dapp",
      secondRow: "1/2024",
      thirdRow: "current",
      fourthRow: "None",
    },
    {
      id: 2,
      firstRow: "Tailwind.js project",
      secondRow: "2/2022",
      thirdRow: "12/2023",
      fourthRow: "None",
    },
    {
      id: 3,
      firstRow: "University project",
      secondRow: "Common",
      thirdRow: "1,620  /  10,000",
      fourthRow: "None",
    },
  ];

  const tableData2 = [
    {
      id: 1,
      firstRow: "Suresh Arora",
      secondRow: "RAIRprotocol",
      thirdRow: "Coworker",
      fourthRow: "None",
    },
    {
      id: 2,
      firstRow: "Eduardo Boss",
      secondRow: "mor.io",
      thirdRow: "co-worker (frontend)",
      fourthRow: "None",
    },
  ];

  useEffect(() => {
    editBackground();
  }, [editBackground]);

  useEffect(() => {
    getMyNft(showTokensRef.current, 1);
  }, [getMyNft, showTokensRef]);

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  useEffect(() => {
    handleNewUserStatus();
  }, [handleNewUserStatus]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const hotdropsVar = import.meta.env.VITE_TESTNET;

  if (userData === undefined) {
    return <LoadingComponent />;
  }

  return (
    <div className={`${width > 1025 ? "container" : "wrapper-user-page"}`}>
      {/* <div>
        <SharePopUp
          selectedValue={selectedValue}
          open={open}
          onClose={handleClose}
        />
      </div> */}
      <div>
        <Popup
          // className="popup-settings-block"
          open={open}
          position="bottom center"
          closeOnDocumentClick
          onClose={() => {
            setOpen(false);
          }}
        >
          <div
            style={{
              height: "487px",
              width: "515px",
              borderRadius: "1rem",
              background: "#000000",
              border: "1px solid #5E3DFC",
              color: "#fff",
              padding: "40px",
              fontSize: "24px",
              fontWeight: "100",
            }}
          >
            <p>
              Level = representation of score in the system. Earn points to
              increase level by completing tasks
            </p>
            <p>
              Rank = Position of user relative to all other users (approximate
              value of payout at TGE for{" "}
              <span
                style={{
                  fontWeight: "900",
                }}
              >
                current rank
              </span>
              )
            </p>
            <p>
              Lvl + = Number of levels required to reach next rank (approximate
              value of payout at TGE for{" "}
              <span
                style={{
                  fontWeight: "900",
                }}
              >
                next rank
              </span>
              )
            </p>
          </div>
        </Popup>
      </div>
      {userData ? (
        <>
          <div className="breadcrumbs">
            <Stack
              style={{ marginBottom: "2rem", paddingLeft: "0.5rem" }}
              spacing={2}
            >
              <Breadcrumbs
                color="white"
                separator={
                  <FontAwesomeIcon icon={faGreaterThan} fontSize="x-small" />
                }
                aria-label="breadcrumb"
              >
                {breadcrumbs}
              </Breadcrumbs>
            </Stack>
          </div>
          <div
            className={`user-page-background ${
              primaryColor === "#dedede" ? "rhyno" : "charcoal"
            } ${
              hotdropsVar === "true" && !userData.background
                ? "hotdrops-bg-default-banner"
                : ""
            }`}
            style={{
              backgroundImage:
                userData && userData?.background
                  ? `url(${userData?.background})`
                  : "",
            }}
          >
            {userData && !userData.background && (
              <>
                {hotdropsVar !== "true" && (
                  <img src={headerLogo} alt="background-logo-default" />
                )}
              </>
            )}
            {currentUserAddress &&
              currentUserAddress &&
              currentUserAddress === userAddress && (
                <div
                  className={"blockAddBack"}
                  style={{
                    position: "absolute",
                    top: "0",
                    right: "0",
                  }}
                >
                  <label className={"inputFile"}>
                    <FontAwesomeIcon icon={faPlus} className="plus" />
                    <input
                      disabled={loadingBg ? true : false}
                      type="file"
                      onChange={photoUpload}
                    />
                  </label>
                </div>
              )}
          </div>
          <div
            className={`my-items-header-wrapper user ${
              currentUserAddress === userAddress && "edit"
            }`}
          >
            {currentUserAddress === userAddress ? (
              <>
                <PersonalProfileIcon setEditModeUpper={setEditMode} />
              </>
            ) : (
              <div className="personal-profile-box">
                <div className="profile-avatar-block">
                  {userData.avatar ? (
                    <ImageLazy
                      className="profile-avatar-img"
                      alt="User Avatar"
                      src={userData.avatar ? userData.avatar : ""}
                    />
                  ) : (
                    <div className="personal-default-avatar">
                      <SvgUserIcon />
                    </div>
                  )}
                </div>
                <div className="profile-name-box">
                  <>
                    <TooltipBox title={"Click to copy this address"}>
                      <span
                        onClick={() => {
                          if (userAddress) {
                            navigator.clipboard.writeText(userAddress);
                            setCopyState(true);

                            setTimeout(() => {
                              setCopyState(false);
                            }, 3000);
                          }
                        }}
                        className={`profileName ${textColor}`}
                      >
                        {!copyState
                          ? (userData &&
                            userData.nickName &&
                            userData.nickName.length > 20
                              ? userData.nickName.slice(0, 5) +
                                "...." +
                                userData.nickName.slice(length - 4)
                              : userData.nickName) ||
                            (userAddress &&
                              userAddress.slice(0, 4) +
                                "...." +
                                userAddress.slice(length - 4))
                          : "Copied!"}
                      </span>
                    </TooltipBox>
                  </>
                </div>
              </div>
            )}
            {!editMode && (
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                }}
              >
                <div
                  style={{
                    width: "220px",
                    height: "46px",
                    border: "1px solid #A876B3",
                    borderRadius: "1rem",
                    marginRight: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "20px",
                  }}
                >
                  Rank 81{" "}
                  <span
                    style={{
                      width: "0",
                      height: "0",
                      borderLeft: "10px solid transparent",
                      borderRight: "10px solid transparent",
                      borderBottom: "15px solid #00FF48",
                      margin: "0 5px",
                    }}
                  ></span>{" "}
                  (±4.2k)
                </div>
                <div
                  style={{
                    width: "220px",
                    height: "46px",
                    border: "1px solid #A876B3",
                    borderRadius: "1rem",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "20px",
                  }}
                >
                  Lvl + 4 (±13.2k)
                </div>
              </div>
            )}
            {/* {!editMode && (
              <CustomShareButton title="Share" handleClick={handleClickOpen} />
            )} */}
            {!editMode && (
              <CustomShareButton title="Learn" handleClick={handleClickOpen} />
            )}
          </div>
          <div className="user-page-add-content">
            <div className="title-of-add-content">Top Languages</div>
            <div className="container-languages">
              <div className="languages-box">57% Javascript</div>
              <div className="languages-box">10% Rust</div>
              <div className="languages-box">2% Go</div>
              <div className="languages-box">14% Solidity</div>
            </div>
            <div className="title-of-add-content">
              <div>Completed Tasks</div>
              <div>
                {!allRewards && videos.length > 4 && (
                  <button
                    onClick={() => {
                      setAllRewards(true);
                    }}
                  >
                    {"All rewards  >>"}
                  </button>
                )}
              </div>
            </div>
            <EarnRewards
              userVideoList={videos}
              setAllRewards={setAllRewards}
              allRewards={allRewards}
            />
            <div className="title-of-add-content">Experience</div>
            <LeaderBoard
              userpage={true}
              titleColumn={titleColumnExp}
              tableData={tableData1}
            />
            <div className="title-of-add-content">References</div>
            <LeaderBoard
              userpage={true}
              titleColumn={titleColumnRef}
              tableData={tableData2}
            />
          </div>

          <div className="tabs-section">
            <Tabs
              selectedIndex={tabIndexItems}
              onSelect={(index) => setTabIndexItems(index)}
            >
              <TabList className="category-wrapper userpage">
                <Tab
                  selectedClassName={`search-tab-selected-${
                    primaryColor === "#dedede" ? "default" : "dark"
                  }`}
                  style={{
                    backgroundColor: `${
                      primaryColor === "#dedede" ? "#fafafa" : "#222021"
                    }`,
                    border: `1px solid ${
                      primaryColor === "#dedede" ? "var(--rhyno)" : "#4E4D4D"
                    }`,
                  }}
                  className="category-button-nft category-button"
                >
                  Collected
                </Tab>
                <Tab
                  selectedClassName={`search-tab-selected-${
                    primaryColor === "#dedede" ? "default" : "dark"
                  }`}
                  style={{
                    backgroundColor: `${
                      primaryColor === "#dedede" ? "#fafafa" : "#222021"
                    }`,
                    border: `1px solid ${
                      primaryColor === "#dedede" ? "var(--rhyno)" : "#4E4D4D"
                    }`,
                  }}
                  className="category-button-videos category-button"
                >
                  {width > 676 ? "Created" : "Created"}
                </Tab>
                <Tab
                  selectedClassName={`search-tab-selected-${
                    primaryColor === "#dedede" ? "default" : "dark"
                  }`}
                  style={{
                    backgroundColor: `${
                      primaryColor === "#dedede" ? "#fafafa" : "#222021"
                    }`,
                    border: `1px solid ${
                      primaryColor === "#dedede" ? "var(--rhyno)" : "#4E4D4D"
                    }`,
                  }}
                  className="category-button-videos category-button"
                >
                  {width > 676 ? (
                    "Favorited"
                  ) : (
                    <FontAwesomeIcon icon={faHeart} />
                  )}
                </Tab>
                <Tab
                  selectedClassName={`search-tab-selected-${
                    primaryColor === "#dedede" ? "default" : "dark"
                  }`}
                  style={{
                    backgroundColor: `${
                      primaryColor === "#dedede" ? "#fafafa" : "#222021"
                    }`,
                    border: `1px solid ${
                      primaryColor === "#dedede" ? "var(--rhyno)" : "#4E4D4D"
                    }`,
                  }}
                  className="category-button-videos category-button"
                >
                  {width > 676 ? (
                    "Videos"
                  ) : (
                    <VideoIcon primaryColor={primaryColor} />
                  )}
                </Tab>
              </TabList>
              <div className="bar-wrapper">
                <InputField
                  getter={titleSearch}
                  setter={setTitleSearch}
                  placeholder={"Search..."}
                  customCSS={{
                    backgroundColor: `${
                      primaryColor === "#dedede"
                        ? `var(--rhyno)`
                        : `color-mix(in srgb, ${primaryColor} 50%, #aaaaaa)`
                    }`,
                    color: `var(--${textColor})`,
                    borderTopLeftRadius: "0",
                    border: `${
                      primaryColor === "#dedede"
                        ? "solid 1px var(--rhyno)"
                        : `solid 1px color-mix(in srgb, ${primaryColor}, #888888)`
                    } `,
                    paddingLeft: "2rem",
                  }}
                  customClass="form-control input-styled user-search"
                />

                <div className="nft-form-control-icon">
                  <i className="fas-custom">
                    <FontAwesomeIcon
                      icon={faSearch}
                      size="lg"
                      style={{
                        color:
                          import.meta.env.VITE_TESTNET === "true"
                            ? `${
                                iconColor === "#1486c5" ? "#F95631" : iconColor
                              }`
                            : `${
                                iconColor === "#1486c5" ? "#E882D5" : iconColor
                              }`,
                      }}
                    />
                  </i>
                  <FilteringBlock
                    primaryColor={primaryColor}
                    setSortItem={setSortItem}
                    sortItem={sortItem}
                    isFilterShow={currentUserAddress === userAddress}
                    metadataFilter={metadataFilter}
                    setMetadataFilter={() => setMetadataFilter((prev) => !prev)}
                    tabIndexItems={tabIndexItems}
                  />
                </div>
              </div>
              <div className="user-page-main-tab-block">
                <TabPanel>
                  <PersonalProfileMyNftTab
                    filteredData={collectedTokens}
                    defaultImg={`${process.env.REACT_APP_IPFS_GATEWAY}/QmNtfjBAPYEFxXiHmY5kcPh9huzkwquHBcn9ZJHGe7hfaW`}
                    textColor={textColor}
                    getMyNft={getMyNft}
                    totalCount={totalCount}
                    isLoading={isLoading}
                    showTokensRef={showTokensRef}
                    titleSearch={titleSearch}
                    primaryColor={primaryColor}
                    isResaleLoading={isResaleLoading}
                    setIsResaleLoding={setIsResaleLoding}
                    setOnResale={setOnResale}
                    onResale={onResale}
                    metadataFilter={metadataFilter}
                    setMetadataFilter={setMetadataFilter}
                  />
                </TabPanel>
                <TabPanel>
                  <UserProfileCreated
                    contractData={createdContracts && createdContracts}
                    titleSearch={titleSearch}
                  />
                </TabPanel>
                <TabPanel>
                  <UserProfileFavoritesTab
                    userAddress={userAddress}
                    titleSearch={titleSearch}
                  />
                </TabPanel>
                <TabPanel>
                  <PersonalProfileMyVideoTab
                    publicAddress={userData.publicAddress}
                    titleSearch={titleSearch}
                  />
                </TabPanel>
              </div>
            </Tabs>
          </div>
        </>
      ) : (
        <>
          <h2>User is not found</h2>
        </>
      )}
    </div>
  );
};

export default UserProfilePage;
