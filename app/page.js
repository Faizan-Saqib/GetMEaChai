import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="header h-80 flex flex-col justify-center gap-4 items-center text-center">
        <div className="htexts flex justify-center items-center">
          <h1 className="text-3xl font-bold">Get ME a Pie</h1>
          <img src="/pie.gif" className="h-20 w-20" alt="Pie" />
        </div>
        <div className="texts flex-col flex justify-center items-center gap-2">
          <p className="text-sm text-gray-300">
            A crowdfunding platform for creators to fund their projects.
          </p>
          <p className="text-sm text-gray-300">
            A place where fans can buy you pie. Unleash the power of your fans and get your projects funded.
          </p>
        </div>
        <div className="buttons flex gap-4">
          <Link href={"/login"}>
            <button
              type="button"
              className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-sm text-sm px-4 py-2.5 text-center leading-5"
            >
              Start Here
            </button>
          </Link>
          <Link href={"/about"}>
            <button
              type="button"
              className="text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-sm text-sm px-4 py-2.5 text-center leading-5"
            >
              Read More
            </button>
          </Link>
        </div>
      </div>

      <div className="line bg-gray-600 h-px"></div>

      <div className="fanscanbuyyoupie h-96 flex flex-col justify-center gap-12 items-center text-center">
        <h1 className="text-xl font-bold">Fans can buy you pie</h1>
        <div className="boxes flex gap-28">
          <div className="box1 flex flex-col justify-center items-center gap-2">
            <div className="gif bg-gray-500 rounded-full w-28 h-28 flex justify-center items-center">
              <img className="h-24 w-24" src="/man.gif" alt="" />
            </div>
            <h2 className="text-md font-semibold">Fans want to help</h2>
            <h3 className="text-sm font-normal">Your fans are available to support you</h3>
          </div>
          <div className="box2 flex flex-col justify-center items-center gap-2">
            <div className="gif bg-gray-500 rounded-full w-28 h-28 flex justify-center items-center">
              <img className="h-24 w-24" src="/coin.gif" alt="" />
            </div>
            <h2 className="text-md font-semibold">Fans want to contribute</h2>
            <h3 className="text-sm font-normal">Your fans are willing to contribute financially</h3>
          </div>
          <div className="box3 flex flex-col justify-center items-center gap-2">
            <div className="gif bg-gray-500 rounded-full w-28 h-28 flex justify-center items-center">
              <img className="h-24 w-24" src="/group.gif" alt="" />
            </div>
            <h2 className="text-md font-semibold">Fans want to collaborate</h2>
            <h3 className="text-sm font-normal">Your fans are ready to collaborate with you</h3>
          </div>
        </div>
      </div>

      <div className="line bg-gray-600 h-px"></div>

      <div className="learnmore h-[500px] flex flex-col justify-center gap-12 items-center text-center">
        <h1 className="text-xl font-bold">Learn More</h1>
        <div className="video">
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/uKzvpopTFfM?si=fDJiNibBT2KdkI2r"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </>
  );
}
